import asyncio
import json
import time
from contextlib import suppress
from collections.abc import AsyncIterator

import httpx
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.demo_voice_agent import DemoVoiceAgent
from app.services.stt_service import DeepgramSTTService, LowConfidenceError
from app.utils.logger import get_logger

router = APIRouter(prefix="/demo", tags=["demo"])
logger = get_logger(__name__)


@router.websocket("/voice/ws")
async def demo_voice_ws(websocket: WebSocket) -> None:
    await websocket.accept()
    audio_queue: asyncio.Queue[bytes | None] = asyncio.Queue(maxsize=100)
    agent = DemoVoiceAgent()
    stt = DeepgramSTTService()
    response_lock = asyncio.Lock()
    last_final_text = ""
    last_final_at = 0.0
    pending_final_task: asyncio.Task[None] | None = None

    async def audio_stream() -> AsyncIterator[bytes]:
        while True:
            chunk = await audio_queue.get()
            try:
                if chunk is None:
                    break
                yield chunk
            finally:
                audio_queue.task_done()

    async def transcribe() -> None:
        nonlocal last_final_at, last_final_text, pending_final_task

        async def respond_to_final(text: str, language: str | None, confidence: float) -> None:
            nonlocal last_final_at, last_final_text
            normalized_text = " ".join(text.lower().split())
            now = time.monotonic()
            if normalized_text == last_final_text and now - last_final_at < 3.0:
                logger.info("demo_voice_duplicate_final_ignored", text=text)
                return
            last_final_text = normalized_text
            last_final_at = now
            async with response_lock:
                response = await agent.respond(text, language, confidence)
                await websocket.send_json({"type": "assistant", **response})
                if response["order_complete"]:
                    await websocket.send_json({"type": "order", "order": response["order"]})

        async def delayed_final(text: str, language: str | None, confidence: float) -> None:
            await asyncio.sleep(0.9)
            await respond_to_final(text, language, confidence)

        try:
            async for event in stt.stream_browser_transcripts(audio_stream()):
                await websocket.send_json(
                    {
                        "type": "transcript",
                        "text": event.text,
                        "is_final": event.is_final,
                        "speech_final": event.speech_final,
                        "confidence": event.confidence,
                        "language": event.language,
                    }
                )
                if not event.is_final:
                    continue
                if pending_final_task is not None and not pending_final_task.done():
                    pending_final_task.cancel()
                    await asyncio.gather(pending_final_task, return_exceptions=True)
                if event.speech_final:
                    await respond_to_final(event.text, event.language, event.confidence)
                    continue
                pending_final_task = asyncio.create_task(delayed_final(event.text, event.language, event.confidence))
        except LowConfidenceError as exc:
            await websocket.send_json({"type": "error", "message": f"Low confidence transcript: {exc.confidence:.2f}"})
        except asyncio.CancelledError:
            raise
        except Exception as exc:
            logger.exception("demo_voice_failed", error=str(exc))
            await websocket.send_json({"type": "error", "message": str(exc)})
        finally:
            if pending_final_task is not None and not pending_final_task.done():
                pending_final_task.cancel()
                with suppress(asyncio.CancelledError):
                    await pending_final_task

    transcription_task: asyncio.Task[None] | None = None
    try:
        while True:
            message = await websocket.receive()
            if message.get("bytes") is not None:
                if transcription_task is None:
                    transcription_task = asyncio.create_task(transcribe())
                if audio_queue.full():
                    _ = audio_queue.get_nowait()
                    audio_queue.task_done()
                await audio_queue.put(message["bytes"])
                continue
            text = message.get("text")
            if text is None:
                continue
            try:
                payload = json.loads(text)
            except json.JSONDecodeError:
                await websocket.send_json({"type": "error", "message": "Invalid demo voice command."})
                continue
            command_type = payload.get("type")
            if command_type == "start":
                try:
                    greeting = await agent.greeting()
                except httpx.HTTPStatusError as exc:
                    logger.exception(
                        "demo_voice_greeting_failed",
                        status_code=exc.response.status_code,
                        provider="elevenlabs",
                    )
                    await websocket.send_json(
                        {
                            "type": "error",
                            "message": "ElevenLabs rejected the TTS request. Check ELEVENLABS_API_KEY and DEMO_ELEVENLABS_VOICE_ID in freja-ai/.env, then restart the backend.",
                        }
                    )
                    continue
                await websocket.send_json({"type": "assistant", **greeting})
            if command_type == "stop":
                await audio_queue.put(None)
    except WebSocketDisconnect:
        logger.info("demo_voice_disconnected")
    finally:
        await audio_queue.put(None)
        if transcription_task is not None:
            transcription_task.cancel()
            await asyncio.gather(transcription_task, return_exceptions=True)
