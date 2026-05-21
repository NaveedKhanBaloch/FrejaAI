from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.menu import MenuItem
from app.models.restaurant import Restaurant
from app.services.menu_seed import SWEDISH_PIZZA_MENU


async def ensure_demo_restaurant(session: AsyncSession) -> Restaurant:
    settings = get_settings()
    result = await session.execute(select(Restaurant).where(Restaurant.name == settings.demo_restaurant_name))
    restaurant = result.scalar_one_or_none()
    if restaurant is None:
        restaurant = Restaurant(
            name=settings.demo_restaurant_name,
            phone_number=settings.demo_restaurant_phone,
            vonage_number=settings.demo_restaurant_vonage_number,
            voice_id=settings.demo_elevenlabs_voice_id,
            timezone="Europe/Stockholm",
            is_active=True,
        )
        session.add(restaurant)
        await session.flush()

    result = await session.execute(select(MenuItem).where(MenuItem.restaurant_id == restaurant.id))
    existing_items = {item.name.casefold(): item for item in result.scalars()}
    for seed_item in SWEDISH_PIZZA_MENU:
        existing = existing_items.get(str(seed_item["name"]).casefold())
        if existing is None:
            session.add(MenuItem(restaurant_id=restaurant.id, is_available=True, **seed_item))
        # Existing rows are restaurant-managed data. Do not overwrite staff edits
        # such as prices, descriptions, modifiers, or availability during startup.
    await session.commit()
    await session.refresh(restaurant)
    return restaurant
