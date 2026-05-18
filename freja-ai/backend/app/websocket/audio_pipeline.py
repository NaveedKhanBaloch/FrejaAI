import asyncio
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from typing import Any

from app.config import get_settings
from app.services.call_session import CallSessionStore
from app.services.language_detection import LanguageDetectionService
from app.services.llm_service import LLMService
from app.services.stt_service import DeepgramSTTService, LowConfidenceError
from app.services.tts_service import ElevenLabsTTSService
from app.utils.logger import get_logger

logger = get_logger(__name__)
AudioSender = Callable[[bytes], Awaitable[None]]


@dataclass(slots=True)
class PipelineContext:
    call_uuid: str
    restaurant_name: str
    restaurant_voice_id: str
    menu: list[dict[str, Any]]


class AudioPipeline:
    def __init__(
        self,
        context: PipelineContext,
        send_audio: AudioSender,
        stt: DeepgramSTTService | None = None,
        llm: LLMService | None = None,
        tts: ElevenLabsTTSService | None = None,
        sessions: CallSessionStore | None = None,
    ) -> None:
        settings = get_settings()
        self.context = context
        self.input_audio: asyncio.Queue[bytes | None] = asyncio.Queue(maxsize=settings.max_audio_queue_size)
        self.output_audio: asyncio.Queue[bytes | None] = asyncio.Queue(maxsize=settings.max_audio_queue_size)
        self._send_audio = send_audio
        self._stt = stt or DeepgramSTTService()
        self._llm = llm or LLMService()
        self._tts = tts or ElevenLabsTTSService()
        self._sessions = sessions or CallSessionStore()
        self._language = LanguageDetectionService(self._sessions)
        self._tasks: set[asyncio.Task[None]] = set()
        self._closed = asyncio.Event()

    async def start(self) -> None:
        self._track(asyncio.create_task(self._transcribe_loop()))
        self._track(asyncio.create_task(self._send_loop()))

    async def accept_audio(self, chunk: bytes) -> None:
        if self.input_audio.full():
            _ = self.input_audio.get_nowait()
            self.input_audio.task_done()
        await self.input_audio.put(chunk)

    async def handle_metadata(self, payload: dict[str, Any]) -> None:
        await self._sessions.update(self.context.call_uuid, metadata=payload)

    async def drain(self) -> None:
        await self.input_audio.put(None)
        await self.output_audio.put(None)
        self._closed.set()
        for task in list(self._tasks):
            task.cancel()
        await asyncio.gather(*self._tasks, return_exceptions=True)
        while not self.input_audio.empty():
            self.input_audio.get_nowait()
            self.input_audio.task_done()
        while not self.output_audio.empty():
            self.output_audio.get_nowait()
            self.output_audio.task_done()

    async def _audio_iterator(self):
        while not self._closed.is_set():
            chunk = await self.input_audio.get()
            try:
                if chunk is None:
                    break
                yield chunk
            finally:
                self.input_audio.task_done()

    async def _transcribe_loop(self) -> None:
        try:
            async for transcript in self._stt.stream_transcripts(self._audio_iterator()):
                if not transcript.is_final:
                    await self._tts.cancel_stream()
                    continue
                language = await self._language.detect(self.context.call_uuid, transcript.text, transcript.language, transcript.confidence)
                await self._respond(transcript.text, language)
        except LowConfidenceError as exc:
            logger.warning("low_confidence_transcript", call_uuid=self.context.call_uuid, confidence=exc.confidence)
        except asyncio.CancelledError:
            raise
        except Exception as exc:
            logger.exception("audio_pipeline_failed", call_uuid=self.context.call_uuid, error=str(exc))
            raise

    async def _respond(self, text: str, language: str) -> None:
        session = await self._sessions.get(self.context.call_uuid)
        chunks: list[str] = []
        async for token in self._llm.stream_response(
            self.context.call_uuid,
            self.context.restaurant_name,
            self.context.menu,
            language,
            dict(session.get("order_state", {})),
            text,
        ):
            chunks.append(token)
        response = "".join(chunks).strip()
        if response:
            await self._tts.speak_to_queue(response, self.context.restaurant_voice_id, self.output_audio)

    async def _send_loop(self) -> None:
        while not self._closed.is_set():
            chunk = await self.output_audio.get()
            try:
                if chunk is None:
                    break
                await self._send_audio(chunk)
            finally:
                self.output_audio.task_done()

    def _track(self, task: asyncio.Task[None]) -> None:
        self._tasks.add(task)
        task.add_done_callback(self._tasks.discard)
