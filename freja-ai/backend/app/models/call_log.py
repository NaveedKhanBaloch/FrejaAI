from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class CallLog(Base):
    __tablename__ = "call_logs"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    restaurant_id: Mapped[UUID] = mapped_column(ForeignKey("restaurants.id", ondelete="CASCADE"), index=True)
    call_uuid: Mapped[str] = mapped_column(String(128), unique=True, nullable=False, index=True)
    customer_phone: Mapped[str | None] = mapped_column(String(32))
    duration_seconds: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    transcript: Mapped[str | None] = mapped_column(Text)
    recording_url: Mapped[str | None] = mapped_column(Text)
    detected_language: Mapped[str | None] = mapped_column(String(8))
    ai_confidence_avg: Mapped[float | None] = mapped_column(Float)
    outcome: Mapped[str | None] = mapped_column(String(64), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    restaurant = relationship("Restaurant", back_populates="call_logs")
    orders = relationship("Order", back_populates="call_log")
