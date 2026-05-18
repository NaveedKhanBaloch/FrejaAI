import base64
import json
from typing import Any

from fastapi import WebSocket, WebSocketDisconnect
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.menu import MenuItem
from app.models.restaurant import Restaurant
from app.services.call_session import CallSessionStore
from app.utils.logger import get_logger
from app.websocket.audio_pipeline import AudioPipeline, PipelineContext

logger = get_logger(__name__)


class VonageWebSocketHandler:
    def __init__(self, session: AsyncSession, session_store: CallSessionStore | None = None) -> None:
        self._session = session
        self._sessions = session_store or CallSessionStore()

    async def handle(self, websocket: WebSocket, call_uuid: str) -> None:
        await websocket.accept()
        restaurant = await self._restaurant_for_call(call_uuid)
        menu = await self._menu_for_restaurant(restaurant.id)

        async def send_audio(chunk: bytes) -> None:
            await websocket.send_bytes(chunk)

        pipeline = AudioPipeline(
            PipelineContext(call_uuid=call_uuid, restaurant_name=restaurant.name, restaurant_voice_id=restaurant.voice_id, menu=menu),
            send_audio,
            sessions=self._sessions,
        )
        await pipeline.start()
        await self._sessions.update(call_uuid, restaurant_id=str(restaurant.id))
        try:
            while True:
                message = await websocket.receive()
                if "bytes" in message and message["bytes"] is not None:
                    await pipeline.accept_audio(message["bytes"])
                elif "text" in message and message["text"] is not None:
                    await self._handle_text_event(pipeline, message["text"])
        except WebSocketDisconnect:
            logger.info("vonage_ws_disconnected", call_uuid=call_uuid)
        finally:
            await pipeline.drain()

    async def _handle_text_event(self, pipeline: AudioPipeline, text: str) -> None:
        payload = json.loads(text)
        event_type = payload.get("event")
        if event_type == "media" and payload.get("media", {}).get("payload"):
            chunk = base64.b64decode(str(payload["media"]["payload"]))
            await pipeline.accept_audio(chunk)
            return
        await pipeline.handle_metadata(payload)

    async def _restaurant_for_call(self, call_uuid: str) -> Restaurant:
        data = await self._sessions.get(call_uuid)
        restaurant_id = data.get("restaurant_id")
        if restaurant_id:
            restaurant = await self._session.get(Restaurant, restaurant_id)
            if restaurant is not None:
                return restaurant
        result = await self._session.execute(select(Restaurant).where(Restaurant.is_active.is_(True)).limit(1))
        restaurant = result.scalar_one_or_none()
        if restaurant is None:
            raise RuntimeError("No active restaurant configured")
        return restaurant

    async def _menu_for_restaurant(self, restaurant_id: Any) -> list[dict[str, Any]]:
        result = await self._session.execute(
            select(MenuItem).where(MenuItem.restaurant_id == restaurant_id, MenuItem.is_available.is_(True)).order_by(MenuItem.sort_order)
        )
        return [
            {
                "id": item.id,
                "name": item.name,
                "category": item.category,
                "base_price": item.base_price,
                "description": item.description,
                "is_available": item.is_available,
                "allergens": item.allergens,
                "modifiers": item.modifiers,
            }
            for item in result.scalars()
        ]
