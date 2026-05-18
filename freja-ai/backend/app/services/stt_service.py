import asyncio
import json
from collections.abc import AsyncIterator
from dataclasses import dataclass
from typing import Any

import websockets

from app.config import get_settings
from app.utils.logger import get_logger

logger = get_logger(__name__)


class LowConfidenceError(Exception):
    def __init__(self, confidence: float) -> None:
        super().__init__(f"Speech confidence below threshold: {confidence:.2f}")
        self.confidence = confidence


@dataclass(slots=True)
class TranscriptEvent:
    text: str
    is_final: bool
    speech_final: bool
    confidence: float
    language: str | None


class DeepgramSTTService:
    def __init__(self, api_key: str | None = None) -> None:
        self._settings = get_settings()
        self._api_key = api_key or self._settings.deepgram_api_key

    async def stream_transcripts(self, audio: AsyncIterator[bytes]) -> AsyncIterator[TranscriptEvent]:
        url = (
            "wss://api.deepgram.com/v1/listen"
            "?model=nova-2&language=multi&encoding=linear16&sample_rate=16000"
            "&channels=1&punctuate=true&interim_results=true&endpointing=300"
        )
        async with websockets.connect(url, extra_headers={"Authorization": f"Token {self._api_key}"}) as ws:
            sender = asyncio.create_task(self._send_audio(ws, audio))
            try:
                async for message in ws:
                    event = self._parse_message(str(message))
                    if event is None:
                        continue
                    if event.is_final and event.confidence < self._settings.stt_confidence_threshold:
                        raise LowConfidenceError(event.confidence)
                    yield event
            finally:
                sender.cancel()
                await asyncio.gather(sender, return_exceptions=True)

    async def stream_browser_transcripts(self, audio: AsyncIterator[bytes]) -> AsyncIterator[TranscriptEvent]:
        url = (
            "wss://api.deepgram.com/v1/listen"
            "?model=nova-2&language=multi"
            "&punctuate=true&interim_results=true&endpointing=300"
        )
        async with websockets.connect(url, extra_headers={"Authorization": f"Token {self._api_key}"}) as ws:
            sender = asyncio.create_task(self._send_audio(ws, audio))
            try:
                async for message in ws:
                    event = self._parse_message(str(message))
                    if event is None:
                        continue
                    if event.is_final and event.confidence < self._settings.stt_confidence_threshold:
                        raise LowConfidenceError(event.confidence)
                    yield event
            finally:
                sender.cancel()
                await asyncio.gather(sender, return_exceptions=True)

    async def _send_audio(self, ws: Any, audio: AsyncIterator[bytes]) -> None:
        async for chunk in audio:
            await ws.send(chunk)
        await ws.send(json.dumps({"type": "CloseStream"}))

    def _parse_message(self, message: str) -> TranscriptEvent | None:
        payload = json.loads(message)
        if payload.get("type") not in (None, "Results"):
            return None
        channel = payload.get("channel", {})
        alternatives = channel.get("alternatives", [])
        if not alternatives:
            return None
        best = alternatives[0]
        text = str(best.get("transcript", "")).strip()
        if not text:
            return None
        language = payload.get("metadata", {}).get("detected_language") or best.get("languages", [None])[0]
        return TranscriptEvent(
            text=text,
            is_final=bool(payload.get("is_final") or payload.get("speech_final")),
            speech_final=bool(payload.get("speech_final")),
            confidence=float(best.get("confidence") or 0.0),
            language=language,
        )
