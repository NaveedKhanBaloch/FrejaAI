from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class RestaurantBase(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    phone_number: str
    vonage_number: str
    voice_id: str
    timezone: str = "Europe/Stockholm"
    is_active: bool = True


class RestaurantCreate(RestaurantBase):
    pass


class RestaurantRead(RestaurantBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
