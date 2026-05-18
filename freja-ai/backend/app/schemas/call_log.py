from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class CallLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    restaurant_id: UUID
    call_uuid: str
    customer_phone: str | None
    duration_seconds: int
    transcript: str | None
    recording_url: str | None
    detected_language: str | None
    ai_confidence_avg: float | None
    outcome: str | None
    created_at: datetime


class TranscriptRead(BaseModel):
    call_uuid: str
    transcript: str
