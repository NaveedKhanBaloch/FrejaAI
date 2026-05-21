from datetime import datetime
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    restaurant_id: Mapped[UUID] = mapped_column(ForeignKey("restaurants.id", ondelete="CASCADE"), index=True)
    call_log_id: Mapped[UUID | None] = mapped_column(ForeignKey("call_logs.id", ondelete="SET NULL"), index=True)
    customer_name: Mapped[str | None] = mapped_column(String(200))
    customer_phone: Mapped[str] = mapped_column(String(32), index=True)
    items: Mapped[list[dict[str, Any]]] = mapped_column(JSONB, default=list, nullable=False)
    total_amount: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    order_type: Mapped[str] = mapped_column(String(16), nullable=False)
    delivery_address: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(32), default="pending", nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    restaurant = relationship("Restaurant", back_populates="orders")
    call_log = relationship("CallLog", back_populates="orders")
