from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.models.menu import MenuItem
from app.schemas.menu import MenuItemCreate, MenuItemRead, MenuItemUpdate
from app.utils.security import get_restaurant_id

router = APIRouter(prefix="/menu", tags=["menu"])


@router.get("", response_model=list[MenuItemRead])
async def list_menu(restaurant_id: UUID = Depends(get_restaurant_id), session: AsyncSession = Depends(get_session)) -> list[MenuItem]:
    result = await session.execute(select(MenuItem).where(MenuItem.restaurant_id == restaurant_id).order_by(MenuItem.category, MenuItem.sort_order))
    return list(result.scalars())


@router.post("/item", response_model=MenuItemRead, status_code=201)
async def create_item(payload: MenuItemCreate, restaurant_id: UUID = Depends(get_restaurant_id), session: AsyncSession = Depends(get_session)) -> MenuItem:
    item = MenuItem(restaurant_id=restaurant_id, **payload.model_dump())
    session.add(item)
    await session.commit()
    await session.refresh(item)
    return item


@router.patch("/item/{item_id}", response_model=MenuItemRead)
async def update_item(item_id: UUID, payload: MenuItemUpdate, restaurant_id: UUID = Depends(get_restaurant_id), session: AsyncSession = Depends(get_session)) -> MenuItem:
    item = await session.get(MenuItem, item_id)
    if item is None or item.restaurant_id != restaurant_id:
        raise HTTPException(status_code=404, detail="Menu item not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    await session.commit()
    await session.refresh(item)
    return item


@router.delete("/item/{item_id}", status_code=204)
async def delete_item(item_id: UUID, restaurant_id: UUID = Depends(get_restaurant_id), session: AsyncSession = Depends(get_session)) -> None:
    item = await session.get(MenuItem, item_id)
    if item is None or item.restaurant_id != restaurant_id:
        raise HTTPException(status_code=404, detail="Menu item not found")
    await session.delete(item)
    await session.commit()
