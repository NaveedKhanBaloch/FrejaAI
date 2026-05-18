from fastapi import APIRouter, Depends, Request, WebSocket
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_session
from app.utils.validators import verify_vonage_signature
from app.websocket.vonage_ws_handler import VonageWebSocketHandler

router = APIRouter(prefix="/vonage", tags=["vonage"])


@router.post("/answer")
async def answer_call(request: Request) -> list[dict[str, object]]:
    await verify_vonage_signature(request)
    body = await request.json()
    call_uuid = str(body.get("uuid") or body.get("conversation_uuid") or "unknown")
    ws_url = f"{str(get_settings().backend_url).rstrip('/').replace('https://', 'wss://').replace('http://', 'ws://')}/vonage/ws/{call_uuid}"
    return [{"action": "connect", "endpoint": [{"type": "websocket", "uri": ws_url, "content-type": "audio/l16;rate=16000"}]}]


@router.post("/event")
async def call_event(request: Request) -> dict[str, str]:
    await verify_vonage_signature(request)
    return {"status": "accepted"}


@router.websocket("/ws/{call_uuid}")
async def websocket_audio(call_uuid: str, websocket: WebSocket, session: AsyncSession = Depends(get_session)) -> None:
    await VonageWebSocketHandler(session).handle(websocket, call_uuid)
