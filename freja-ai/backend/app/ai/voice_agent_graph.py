import json
from datetime import datetime, timezone
from typing import Any, TypedDict

from langgraph.graph import END, START, StateGraph
from openai import AsyncOpenAI

from app.ai.order_builder import MenuValidationError, OrderBuilder
from app.ai.prompts.system_prompt import build_system_prompt
from app.config import get_settings
from app.services.language_detection import LANGUAGE_LOCK_TURNS, detect_supported_language


class VoiceAgentState(TypedDict, total=False):
    transcript: str
    stt_language: str | None
    stt_confidence: float
    restaurant_name: str
    menu: list[dict[str, Any]]
    language: str
    language_locked: bool
    language_candidates: list[str]
    history: list[dict[str, str]]
    order_state: dict[str, Any]
    assistant_text: str
    order_complete: bool
    call_ended: bool
    order: dict[str, Any] | None
    validation_error: str | None
    model_raw: str


class VoiceAgentGraph:
    """LangGraph workflow for one completed customer turn.

    Audio transport stays outside the graph. This graph owns the agentic layer:
    language state, model planning, tool-style validation, and response state.
    """

    def __init__(self, client: AsyncOpenAI | None = None) -> None:
        self._settings = get_settings()
        self._client = client or AsyncOpenAI(api_key=self._settings.openai_api_key)
        graph = StateGraph(VoiceAgentState)
        graph.add_node("detect_language", self._detect_language)
        graph.add_node("plan_response", self._plan_response)
        graph.add_node("validate_order", self._validate_order)
        graph.add_edge(START, "detect_language")
        graph.add_edge("detect_language", "plan_response")
        graph.add_edge("plan_response", "validate_order")
        graph.add_edge("validate_order", END)
        self._graph = graph.compile()

    async def run_turn(self, state: VoiceAgentState) -> VoiceAgentState:
        result = await self._graph.ainvoke(state)
        return dict(result)

    async def _detect_language(self, state: VoiceAgentState) -> dict[str, Any]:
        if state.get("language_locked"):
            return {"language": state.get("language", "sv"), "language_locked": True}
        detected = detect_supported_language(
            state.get("transcript", ""),
            state.get("stt_language"),
            float(state.get("stt_confidence", 0.0)),
            self._settings.language_confidence_threshold,
        )
        candidates = [*state.get("language_candidates", []), detected]
        updates: dict[str, Any] = {"language": detected, "language_candidates": candidates}
        if len(candidates) >= LANGUAGE_LOCK_TURNS:
            recent = candidates[-LANGUAGE_LOCK_TURNS:]
            counts = {language: recent.count(language) for language in set(recent)}
            updates["language"] = max(counts, key=lambda language: (counts[language], recent.index(language)))
            updates["language_locked"] = True
        return updates

    async def _plan_response(self, state: VoiceAgentState) -> dict[str, Any]:
        system_prompt = build_system_prompt(
            state["restaurant_name"],
            state["menu"],
            state.get("language", "sv"),
            state.get("order_state", {}),
            datetime.now(timezone.utc),
        )
        messages = [
            {
                "role": "system",
                "content": system_prompt
                + "\n\nYou are running inside a LangGraph voice-ordering workflow. "
                + "Reply as strict JSON only with keys: assistant_text, order_complete, call_ended, order. "
                + "Treat these backend services as tools you must respect: menu validation, order validation, order confirmation, and human handoff. "
                + "Never invent menu items. Keep order null until enough information exists. "
                + "order_complete is true only after the customer clearly confirms the final summary. "
                + "call_ended is true only in the final assistant message after confirmation. "
                + "For pickup/avhämtning set order.address to null and never ask for an address. "
                + "For delivery/leverans ask for an address before final confirmation. "
                + "When complete, order must include id, type, items, address, eta, total.",
            },
            *state.get("history", [])[-12:],
            {"role": "user", "content": state.get("transcript", "")},
        ]
        completion = await self._client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            response_format={"type": "json_object"},
            temperature=0.2,
        )
        raw = completion.choices[0].message.content or "{}"
        payload = self._parse_payload(raw)
        return {
            "model_raw": raw,
            "assistant_text": str(payload.get("assistant_text") or "Could you repeat that?"),
            "order_complete": bool(payload.get("order_complete")),
            "call_ended": bool(payload.get("call_ended")),
            "order": payload.get("order") if isinstance(payload.get("order"), dict) else None,
        }

    async def _validate_order(self, state: VoiceAgentState) -> dict[str, Any]:
        order = state.get("order")
        if not isinstance(order, dict):
            return {"order": None, "validation_error": None}

        if state.get("order_complete"):
            try:
                self._validate_complete_order(order, state.get("menu", []))
            except MenuValidationError as exc:
                return {
                    "order_complete": False,
                    "call_ended": False,
                    "order": None,
                    "validation_error": str(exc),
                    "assistant_text": "I need to double-check that item with the menu. Could you repeat the pizza name?",
                }

        return {"order_state": order, "validation_error": None}

    def _validate_complete_order(self, order: dict[str, Any], menu: list[dict[str, Any]]) -> None:
        builder = OrderBuilder(menu)
        items = order.get("items")
        if not isinstance(items, list) or not items:
            raise MenuValidationError("Order has no items")
        for item in items:
            if isinstance(item, str):
                builder.add_item(item)
                continue
            if not isinstance(item, dict):
                raise MenuValidationError("Invalid order item")
            name = str(item.get("name") or item.get("id") or "")
            quantity = int(item.get("quantity") or 1)
            modifiers = self._modifiers_from_item(item)
            builder.add_item(name, quantity, modifiers)

    def _modifiers_from_item(self, item: dict[str, Any]) -> dict[str, Any]:
        modifiers = dict(item.get("modifiers") or {})
        if item.get("size") and "size" not in modifiers:
            modifiers["size"] = item["size"]
        toppings = item.get("toppings")
        if isinstance(toppings, list) and "add_toppings" not in modifiers:
            modifiers["add_toppings"] = toppings
        return modifiers

    def _parse_payload(self, raw: str) -> dict[str, Any]:
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError:
            return {"assistant_text": raw, "order_complete": False, "call_ended": False, "order": None}
        return parsed if isinstance(parsed, dict) else {"assistant_text": raw, "order_complete": False, "call_ended": False, "order": None}
