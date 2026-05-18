import asyncio
import base64
import json
from collections.abc import AsyncIterator

import httpx
import websockets

from app.config import get_settings


class ElevenLabsTTSService:
    def __init__(self, api_key: str | None = None) -> None:
        self._settings = get_settings()
        self._api_key = api_key or self._settings.elevenlabs_api_key
        self._active_task: asyncio.Task[None] | None = None

    async def stream_audio(self, text: str, voice_id: str) -> AsyncIterator[bytes]:
        url = f"wss://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream-input?output_format=pcm_16000"
        async with websockets.connect(url, extra_headers={"xi-api-key": self._api_key}) as ws:
            await ws.send(json.dumps({"text": " ", "voice_settings": {"stability": 0.5, "similarity_boost": 0.8}}))
            await ws.send(json.dumps({"text": text, "try_trigger_generation": True}))
            await ws.send(json.dumps({"text": ""}))
            async for raw in ws:
                if isinstance(raw, bytes):
                    yield raw
                    continue
                payload = json.loads(raw)
                audio = payload.get("audio")
                if isinstance(audio, str):
                    yield base64.b64decode(audio)
                if audio is None and payload.get("isFinal"):
                    break

    async def synthesize_mp3(self, text: str, voice_id: str, language_code: str | None = None) -> bytes:
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream"
        params = {"output_format": "mp3_44100_128"}
        payload = {
            "text": text,
            "model_id": "eleven_v3",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.8,
                "use_speaker_boost": True,
                "speed": 1.0,
            },
        }
        if language_code:
            payload["language_code"] = language_code
        chunks: list[bytes] = []
        async with httpx.AsyncClient(timeout=30) as client:
            async with client.stream("POST", url, params=params, headers={"xi-api-key": self._api_key}, json=payload) as response:
                response.raise_for_status()
                async for chunk in response.aiter_bytes():
                    if chunk:
                        chunks.append(chunk)
        return b"".join(chunks)

    async def speak_to_queue(self, text: str, voice_id: str, output: asyncio.Queue[bytes]) -> None:
        await self.cancel_stream()

        async def _runner() -> None:
            async for chunk in self.stream_audio(text, voice_id):
                await output.put(chunk)

        self._active_task = asyncio.create_task(_runner())
        try:
            await self._active_task
        finally:
            self._active_task = None

    async def cancel_stream(self) -> None:
        if self._active_task and not self._active_task.done():
            self._active_task.cancel()
            await asyncio.gather(self._active_task, return_exceptions=True)
        self._active_task = None
