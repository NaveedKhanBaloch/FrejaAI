import asyncio
import base64
from collections.abc import AsyncIterator
from typing import Any

from openai import AsyncOpenAI

from app.ai.voice_agent_graph import VoiceAgentGraph
from app.config import get_settings
from app.services.demo_menu import DEMO_MENU
from app.services.tts_service import ElevenLabsTTSService


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
        final_response: dict[str, Any] | None = None
        async for event in self.stream_respond(transcript, stt_language, stt_confidence):
            if event.get("type") == "final":
                final_response = dict(event["response"])
        if final_response is None:
            raise RuntimeError("Voice agent did not produce a final response")
        return final_response

    async def stream_respond(self, transcript: str, stt_language: str | None, stt_confidence: float) -> AsyncIterator[dict[str, Any]]:
        assistant_text_parts: list[str] = []
        final_state: dict[str, Any] | None = None
        audio_task: asyncio.Task[bytes] | None = None
        assistant_language = self._language
        async for event in self._graph.stream_turn(
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
        ):
            if event["type"] == "assistant_delta":
                text = str(event["text"])
                assistant_text_parts.append(text)
                yield {"type": "assistant_delta", "text": text}
                continue
            if event["type"] == "assistant_done":
                assistant_text = str(event.get("assistant_text") or "".join(assistant_text_parts)).strip()
                assistant_language = str(event.get("language") or self._language)
                if assistant_text:
                    audio_task = asyncio.create_task(
                        self._tts.synthesize_mp3(
                            assistant_text,
                            self._settings.demo_elevenlabs_voice_id,
                            language_code=assistant_language,
                        )
                    )
                continue
            if event["type"] == "final":
                final_state = dict(event["state"])

        if final_state is None:
            if audio_task is not None:
                audio_task.cancel()
                await asyncio.gather(audio_task, return_exceptions=True)
            raise RuntimeError("Voice agent graph did not produce final state")
        assistant_text = "".join(assistant_text_parts).strip() or str(final_state.get("assistant_text") or "Could you repeat that?")
        try:
            response = await self._finalize_response(final_state, transcript, assistant_text, audio_task, assistant_language)
            yield {"type": "final", "response": response}
        finally:
            if audio_task is not None and not audio_task.done():
                audio_task.cancel()
                await asyncio.gather(audio_task, return_exceptions=True)

    async def _finalize_response(
        self,
        state: dict[str, Any],
        transcript: str,
        assistant_text: str,
        audio_task: asyncio.Task[bytes] | None = None,
        assistant_language: str | None = None,
    ) -> dict[str, Any]:
        self._language = str(state.get("language", self._language))
        self._language_locked = bool(state.get("language_locked", self._language_locked))
        self._language_candidates = list(state.get("language_candidates", self._language_candidates))
        self._order_state = dict(state.get("order_state", self._order_state))
        order = state.get("order")
        self._history.extend([{"role": "user", "content": transcript}, {"role": "assistant", "content": assistant_text}])
        if audio_task is not None:
            audio = await audio_task
        else:
            audio = await self._tts.synthesize_mp3(
                assistant_text,
                self._settings.demo_elevenlabs_voice_id,
                language_code=assistant_language or self._language,
            )
        return {
            "assistant_text": assistant_text,
            "order_complete": bool(state.get("order_complete")),
            "call_ended": bool(state.get("call_ended")),
            "order": order if isinstance(order, dict) else None,
            "audio_base64": base64.b64encode(audio).decode("ascii"),
            "audio_mime": "audio/mpeg",
        }

    async def _legacy_respond(self, transcript: str, stt_language: str | None, stt_confidence: float) -> dict[str, Any]:
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
