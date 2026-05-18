from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.order import Order
from app.services.automation_service import AutomationService


class OrderService:
    def __init__(self, session: AsyncSession, automation: AutomationService | None = None) -> None:
        self._session = session
        self._automation = automation or AutomationService()

    async def list_orders(self, restaurant_id: UUID, limit: int = 50, offset: int = 0) -> list[Order]:
        result = await self._session.execute(
            select(Order).where(Order.restaurant_id == restaurant_id).order_by(Order.created_at.desc()).limit(limit).offset(offset)
        )
        return list(result.scalars())

    async def live_orders(self, restaurant_id: UUID) -> list[Order]:
        result = await self._session.execute(
            select(Order).where(Order.restaurant_id == restaurant_id, Order.status.in_(["pending", "confirmed", "preparing"])).order_by(Order.created_at)
        )
        return list(result.scalars())

    async def update_status(self, restaurant_id: UUID, order_id: UUID, status: str) -> Order:
        order = await self._session.get(Order, order_id)
        if order is None or order.restaurant_id != restaurant_id:
            raise ValueError("Order not found")
        order.status = status
        if status == "confirmed" and order.confirmed_at is None:
            order.confirmed_at = datetime.now(timezone.utc)
        await self._session.commit()
        await self._session.refresh(order)
        await self._automation.trigger("order.status_updated", {"order_id": str(order.id), "status": order.status})
        return order

    async def create_order(self, restaurant_id: UUID, customer_phone: str, items: list[dict[str, Any]], order_type: str, delivery_address: str | None) -> Order:
        order = Order(
            restaurant_id=restaurant_id,
            customer_phone=customer_phone,
            items=items,
            total_amount=sum(int(item["total_price"]) for item in items),
            order_type=order_type,
            delivery_address=delivery_address,
            status="confirmed",
            confirmed_at=datetime.now(timezone.utc),
        )
        self._session.add(order)
        await self._session.commit()
        await self._session.refresh(order)
        await self._automation.trigger("order.confirmed", {"order_id": str(order.id), "restaurant_id": str(restaurant_id), "total_amount": order.total_amount})
        return order
