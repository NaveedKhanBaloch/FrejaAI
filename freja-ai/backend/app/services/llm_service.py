import json
import re
from collections.abc import AsyncIterator
from typing import Any

from openai import AsyncOpenAI

from app.ai.voice_agent_graph import VoiceAgentGraph
from app.config import get_settings
from app.services.call_session import CallSessionStore

ORDER_TAG_RE = re.compile(r"<order_action>(.*?)</order_action>", re.DOTALL)


class LLMService:
    def __init__(self, session_store: CallSessionStore | None = None, client: AsyncOpenAI | None = None) -> None:
        self._settings = get_settings()
        self._sessions = session_store or CallSessionStore()
        self._client = client or AsyncOpenAI(api_key=self._settings.openai_api_key)
        self._graph = VoiceAgentGraph(self._client)

    async def stream_response(
        self,
        call_uuid: str,
        restaurant_name: str,
        menu: list[dict[str, Any]],
        detected_language: str,
        order_state: dict[str, Any],
        user_text: str,
    ) -> AsyncIterator[str]:
        session = await self._sessions.get(call_uuid)
        history = list(session.get("history", []))[-20:]
        final_state: dict[str, Any] | None = None
        assistant_text_parts: list[str] = []
        async for event in self._graph.stream_turn(
            {
                "transcript": user_text,
                "stt_language": detected_language,
                "stt_confidence": 1.0,
                "restaurant_name": restaurant_name,
                "menu": menu,
                "language": detected_language,
                "language_locked": True,
                "language_candidates": [detected_language],
                "history": history,
                "order_state": order_state,
            }
        ):
            if event["type"] == "assistant_delta":
                delta = str(event["text"])
                assistant_text_parts.append(delta)
                yield delta
                continue
            if event["type"] == "final":
                final_state = dict(event["state"])
        if final_state is None:
            raise RuntimeError("Voice agent graph did not produce final state")
        full_text = "".join(assistant_text_parts).strip() or str(final_state.get("assistant_text") or "").strip()
        await self._sessions.append_history(call_uuid, "user", user_text)
        await self._sessions.append_history(call_uuid, "assistant", full_text)
        if isinstance(final_state.get("order_state"), dict):
            await self._sessions.update(call_uuid, order_state=final_state["order_state"])

    def extract_order_actions(self, response: str) -> list[dict[str, Any]]:
        actions: list[dict[str, Any]] = []
        for match in ORDER_TAG_RE.findall(response):
            parsed = json.loads(match)
            if isinstance(parsed, dict):
                actions.append(parsed)
        return actions

    def _trim_messages(self, messages: list[dict[str, Any]]) -> list[dict[str, Any]]:
        budget = 3000 * 4
        while len(json.dumps(messages, ensure_ascii=False)) > budget and len(messages) > 3:
            del messages[1]
        return messages

    def function_tools(self) -> list[dict[str, Any]]:
        return [
            {"type": "function", "function": {"name": "add_item", "parameters": {"type": "object", "properties": {"name": {"type": "string"}, "quantity": {"type": "integer"}, "modifiers": {"type": "object"}}, "required": ["name", "quantity"]}}},
            {"type": "function", "function": {"name": "remove_item", "parameters": {"type": "object", "properties": {"name": {"type": "string"}}, "required": ["name"]}}},
            {"type": "function", "function": {"name": "update_quantity", "parameters": {"type": "object", "properties": {"name": {"type": "string"}, "quantity": {"type": "integer"}}, "required": ["name", "quantity"]}}},
            {"type": "function", "function": {"name": "set_delivery_address", "parameters": {"type": "object", "properties": {"address": {"type": "string"}}, "required": ["address"]}}},
            {"type": "function", "function": {"name": "confirm_order", "parameters": {"type": "object", "properties": {}}}},
            {"type": "function", "function": {"name": "transfer_to_human", "parameters": {"type": "object", "properties": {"reason": {"type": "string"}}}}},
        ]
