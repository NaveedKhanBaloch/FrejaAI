import base64
from typing import Any

from openai import AsyncOpenAI

from app.ai.voice_agent_graph import VoiceAgentGraph
from app.config import get_settings
from app.services.tts_service import ElevenLabsTTSService


DEMO_MENU: list[dict[str, Any]] = [
    {
        "id": "margherita",
        "name": "Margherita",
        "category": "pizza",
        "base_price": 13900,
        "description": "Tomato, mozzarella, fresh basil",
        "is_available": True,
        "allergens": ["gluten", "milk"],
        "modifiers": {
            "sizes": {"medium": 0, "large": 3000},
            "toppings": {"extra cheese": 2000},
            "half_and_half": True,
        },
    },
    {
        "id": "vesuvio",
        "name": "Vesuvio",
        "category": "pizza",
        "base_price": 14900,
        "description": "Tomato, mozzarella, smoked ham",
        "is_available": True,
        "allergens": ["gluten", "milk"],
        "modifiers": {"sizes": {"medium": 0, "large": 3000}, "toppings": {"extra cheese": 2000}},
    },
    {
        "id": "kebabpizza",
        "name": "Kebabpizza",
        "category": "pizza",
        "base_price": 17900,
        "description": "Kebab, onion, tomato, garlic sauce",
        "is_available": True,
        "allergens": ["gluten", "milk"],
        "modifiers": {"sizes": {"medium": 0, "large": 3000}, "toppings": {"no onion": 0, "extra sauce": 1000}},
    },
]


class DemoVoiceAgent:
    def __init__(self, client: AsyncOpenAI | None = None, tts: ElevenLabsTTSService | None = None) -> None:
        self._settings = get_settings()
        self._graph = VoiceAgentGraph(client or AsyncOpenAI(api_key=self._settings.openai_api_key))
        self._tts = tts or ElevenLabsTTSService()
        self._history: list[dict[str, str]] = []
        self._order_state: dict[str, Any] = {"items": [], "order_type": None, "delivery_address": None, "total_amount": 0}
        self._language = "sv"
        self._language_locked = False
        self._language_candidates: list[str] = []

    async def respond(self, transcript: str, stt_language: str | None, stt_confidence: float) -> dict[str, Any]:
        state = await self._graph.run_turn(
            {
                "transcript": transcript,
                "stt_language": stt_language,
                "stt_confidence": stt_confidence,
                "restaurant_name": self._settings.demo_restaurant_name,
                "menu": DEMO_MENU,
                "language": self._language,
                "language_locked": self._language_locked,
                "language_candidates": self._language_candidates,
                "history": self._history,
                "order_state": self._order_state,
            }
        )
        self._language = state.get("language", self._language)
        self._language_locked = bool(state.get("language_locked", self._language_locked))
        self._language_candidates = list(state.get("language_candidates", self._language_candidates))
        self._order_state = dict(state.get("order_state", self._order_state))
        assistant_text = str(state.get("assistant_text") or "Could you repeat that?")
        order = state.get("order")
        self._history.extend([{"role": "user", "content": transcript}, {"role": "assistant", "content": assistant_text}])
        audio = await self._tts.synthesize_mp3(
            assistant_text,
            self._settings.demo_elevenlabs_voice_id,
            language_code=self._language,
        )
        return {
            "assistant_text": assistant_text,
            "order_complete": bool(state.get("order_complete")),
            "call_ended": bool(state.get("call_ended")),
            "order": order if isinstance(order, dict) else None,
            "audio_base64": base64.b64encode(audio).decode("ascii"),
            "audio_mime": "audio/mpeg",
        }

    def greeting_text(self) -> str:
        return f"Hej! Välkommen till {self._settings.demo_restaurant_name}. Vill du beställa för avhämtning eller leverans?"

    async def greeting(self) -> dict[str, Any]:
        text = self.greeting_text()
        self._history.append({"role": "assistant", "content": text})
        audio = await self._tts.synthesize_mp3(text, self._settings.demo_elevenlabs_voice_id, language_code="sv")
        return {"assistant_text": text, "audio_base64": base64.b64encode(audio).decode("ascii"), "audio_mime": "audio/mpeg"}
