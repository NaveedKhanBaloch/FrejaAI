from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


OrderStatus = Literal["pending", "confirmed", "preparing", "ready", "completed", "cancelled"]
OrderType = Literal["pickup", "delivery"]


class OrderItem(BaseModel):
    menu_item_id: UUID | None = None
    name: str
    quantity: int = Field(ge=1)
    unit_price: int = Field(ge=0)
    total_price: int = Field(ge=0)
    modifiers: dict[str, Any] = Field(default_factory=dict)
    allergens: list[str] = Field(default_factory=list)


class OrderCreate(BaseModel):
    customer_phone: str
    items: list[OrderItem]
    order_type: OrderType
    delivery_address: str | None = None


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


class OrderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    restaurant_id: UUID
    call_log_id: UUID | None
    customer_phone: str
    items: list[dict[str, Any]]
    total_amount: int
    order_type: str
    delivery_address: str | None
    status: str
    created_at: datetime
    confirmed_at: datetime | None
