from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.models.restaurant import Restaurant
from app.models.user import User
from app.schemas.restaurant import RestaurantRead
from app.utils.security import get_current_user

router = APIRouter(prefix="/restaurants", tags=["restaurants"])


@router.get("/current", response_model=RestaurantRead)
async def current_restaurant(user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)) -> Restaurant:
    restaurant = await session.get(Restaurant, user.restaurant_id)
    if restaurant is None:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return restaurant
