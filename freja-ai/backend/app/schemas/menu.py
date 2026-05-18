from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class MenuItemBase(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    category: str = Field(min_length=1, max_length=100)
    base_price: int = Field(ge=0)
    description: str | None = None
    is_available: bool = True
    allergens: list[str] = Field(default_factory=list)
    modifiers: dict[str, Any] = Field(default_factory=dict)
    sort_order: int = 0


class MenuItemCreate(MenuItemBase):
    pass


class MenuItemUpdate(BaseModel):
    name: str | None = None
    category: str | None = None
    base_price: int | None = Field(default=None, ge=0)
    description: str | None = None
    is_available: bool | None = None
    allergens: list[str] | None = None
    modifiers: dict[str, Any] | None = None
    sort_order: int | None = None


class MenuItemRead(MenuItemBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    restaurant_id: UUID
