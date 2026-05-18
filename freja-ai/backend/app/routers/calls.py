from uuid import UUID

import asyncio
import json

from fastapi import APIRouter, Depends, HTTPException, WebSocket
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.models.call_log import CallLog
from app.schemas.call_log import CallLogRead, TranscriptRead
from app.utils.security import get_restaurant_id

router = APIRouter(prefix="/calls", tags=["calls"])


@router.get("", response_model=list[CallLogRead])
async def list_calls(restaurant_id: UUID = Depends(get_restaurant_id), session: AsyncSession = Depends(get_session)) -> list[CallLog]:
    result = await session.execute(select(CallLog).where(CallLog.restaurant_id == restaurant_id).order_by(CallLog.created_at.desc()).limit(100))
    return list(result.scalars())


@router.get("/{call_id}/transcript", response_model=TranscriptRead)
async def transcript(call_id: UUID, restaurant_id: UUID = Depends(get_restaurant_id), session: AsyncSession = Depends(get_session)) -> TranscriptRead:
    call = await session.get(CallLog, call_id)
    if call is None or call.restaurant_id != restaurant_id:
        raise HTTPException(status_code=404, detail="Call not found")
    return TranscriptRead(call_uuid=call.call_uuid, transcript=call.transcript or "")


@router.get("/{call_id}/recording")
async def recording(call_id: UUID, restaurant_id: UUID = Depends(get_restaurant_id), session: AsyncSession = Depends(get_session)) -> RedirectResponse:
    call = await session.get(CallLog, call_id)
    if call is None or call.restaurant_id != restaurant_id or not call.recording_url:
        raise HTTPException(status_code=404, detail="Recording not found")
    return RedirectResponse(call.recording_url)


@router.websocket("/monitor")
async def monitor(websocket: WebSocket) -> None:
    await websocket.accept()
    try:
        while True:
            await websocket.send_text(json.dumps({"type": "active_calls", "value": 0}))
            await asyncio.sleep(5)
    finally:
        await websocket.close()
