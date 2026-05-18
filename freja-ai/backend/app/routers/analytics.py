from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.models.call_log import CallLog
from app.models.order import Order
from app.utils.security import get_restaurant_id

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/summary")
async def summary(restaurant_id: UUID = Depends(get_restaurant_id), session: AsyncSession = Depends(get_session)) -> dict[str, float | int]:
    calls = await session.scalar(select(func.count(CallLog.id)).where(CallLog.restaurant_id == restaurant_id)) or 0
    orders = await session.scalar(select(func.count(Order.id)).where(Order.restaurant_id == restaurant_id)) or 0
    revenue = await session.scalar(select(func.coalesce(func.sum(Order.total_amount), 0)).where(Order.restaurant_id == restaurant_id)) or 0
    missed = await session.scalar(select(func.count(CallLog.id)).where(CallLog.restaurant_id == restaurant_id, CallLog.outcome == "missed")) or 0
    return {"total_calls": calls, "total_orders": orders, "revenue": int(revenue), "conversion_rate": float(orders / calls if calls else 0), "missed_calls": missed}


@router.get("/calls")
async def calls_series(restaurant_id: UUID = Depends(get_restaurant_id), session: AsyncSession = Depends(get_session)) -> list[dict[str, object]]:
    result = await session.execute(select(func.date_trunc("hour", CallLog.created_at).label("hour"), func.count()).where(CallLog.restaurant_id == restaurant_id).group_by("hour").order_by("hour"))
    return [{"hour": str(row.hour), "calls": row.count} for row in result]


@router.get("/orders")
async def orders_series(restaurant_id: UUID = Depends(get_restaurant_id), session: AsyncSession = Depends(get_session)) -> list[dict[str, object]]:
    result = await session.execute(select(func.date_trunc("day", Order.created_at).label("day"), func.sum(Order.total_amount).label("revenue"), func.count().label("orders")).where(Order.restaurant_id == restaurant_id).group_by("day").order_by("day"))
    return [{"day": str(row.day), "revenue": int(row.revenue or 0), "orders": row.orders} for row in result]
