import asyncio
import json
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.schemas.order import OrderRead, OrderStatusUpdate
from app.services.order_service import OrderService
from app.utils.security import get_restaurant_id

router = APIRouter(prefix="/orders", tags=["orders"])


@router.get("", response_model=list[OrderRead])
async def list_orders(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    restaurant_id: UUID = Depends(get_restaurant_id),
    session: AsyncSession = Depends(get_session),
) -> list[object]:
    return await OrderService(session).list_orders(restaurant_id, limit, offset)


@router.get("/live")
async def live_orders(restaurant_id: UUID = Depends(get_restaurant_id), session: AsyncSession = Depends(get_session)) -> StreamingResponse:
    async def stream():
        while True:
            orders = await OrderService(session).live_orders(restaurant_id)
            payload = [OrderRead.model_validate(order).model_dump(mode="json") for order in orders]
            yield f"event: orders\ndata: {json.dumps(payload)}\n\n"
            await asyncio.sleep(10)

    return StreamingResponse(stream(), media_type="text/event-stream")


@router.patch("/{order_id}/status", response_model=OrderRead)
async def update_status(
    order_id: UUID,
    payload: OrderStatusUpdate,
    restaurant_id: UUID = Depends(get_restaurant_id),
    session: AsyncSession = Depends(get_session),
) -> object:
    try:
        return await OrderService(session).update_status(restaurant_id, order_id, payload.status)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
