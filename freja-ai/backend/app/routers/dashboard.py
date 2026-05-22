from collections import Counter, defaultdict
from datetime import datetime
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.models.call_log import CallLog
from app.models.menu import MenuItem
from app.models.order import Order
from app.services.restaurant_seed import ensure_demo_restaurant

router = APIRouter(prefix="/dashboard", tags=["dashboard"])
REVENUE_STATUSES = {"confirmed", "preparing", "ready", "completed", "delivered"}
ACTIVE_STATUSES = {"pending", "confirmed", "preparing", "ready"}


class DashboardStatusUpdate(BaseModel):
    status: str


class DashboardMenuCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    category: str = Field(min_length=1, max_length=100)
    base_price: int = Field(ge=0)
    description: str | None = None
    is_available: bool = True
    allergens: list[str] = Field(default_factory=list)
    modifiers: dict[str, Any] = Field(default_factory=dict)
    sort_order: int = 0


class DashboardMenuUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    category: str | None = Field(default=None, min_length=1, max_length=100)
    base_price: int | None = Field(default=None, ge=0)
    description: str | None = None
    is_available: bool | None = None
    allergens: list[str] | None = None
    modifiers: dict[str, Any] | None = None
    sort_order: int | None = None


def _hour_label(value: datetime) -> str:
    return value.strftime("%H:00")


def _mask_phone(phone: str | None) -> str:
    if not phone or phone in {"unknown", "not_provided"}:
        return "Not provided"
    return f"{phone[:3]} *** *** {phone[-3:]}"


def _item_label(items: list[dict[str, Any]]) -> str:
    labels = []
    for item in items:
        quantity = int(item.get("quantity") or 1)
        name = str(item.get("name") or "Item")
        modifiers = item.get("modifiers") if isinstance(item.get("modifiers"), dict) else {}
        size = item.get("size") or modifiers.get("size")
        flavor = item.get("flavor") or modifiers.get("flavor") or modifiers.get("flavour")
        if not flavor and isinstance(modifiers.get("flavors"), list) and modifiers["flavors"]:
            flavor = modifiers["flavors"][0]
        if not flavor and isinstance(modifiers.get("flavors"), str):
            flavor = modifiers["flavors"]
        details = []
        if size:
            details.append(str(size).title())
        if flavor:
            details.append(str(flavor))
        for key, value in modifiers.items():
            if key in {"size", "flavor", "flavour", "flavors"} or value in {None, False, "", []}:
                continue
            if isinstance(value, list):
                details.extend(f"{key}: {entry}" for entry in value)
            elif value is True:
                details.append(str(key).replace("_", " "))
            else:
                details.append(f"{key}: {value}")
        detail_label = f" — {', '.join(details)}" if details else ""
        labels.append(f"{quantity} x {name}{detail_label}")
    return ", ".join(labels)


async def _restaurant_id(session: AsyncSession) -> UUID:
    restaurant = await ensure_demo_restaurant(session)
    return restaurant.id


async def _orders(session: AsyncSession, restaurant_id: UUID) -> list[Order]:
    result = await session.execute(select(Order).where(Order.restaurant_id == restaurant_id).order_by(Order.created_at.desc()))
    return list(result.scalars())


async def _calls(session: AsyncSession, restaurant_id: UUID) -> list[CallLog]:
    result = await session.execute(select(CallLog).where(CallLog.restaurant_id == restaurant_id).order_by(CallLog.created_at.desc()))
    return list(result.scalars())


def _serialize_order(order: Order) -> dict[str, Any]:
    return {
        "id": str(order.id),
        "display_id": f"#{str(order.id)[:4].upper()}",
        "time": order.created_at.strftime("%H:%M"),
        "items": order.items,
        "items_label": _item_label(order.items),
        "type": order.order_type.upper(),
        "total_amount": order.total_amount,
        "total": f"kr {order.total_amount // 100}" if order.total_amount % 100 == 0 else f"kr {order.total_amount / 100:.2f}",
        "status": order.status.upper(),
        "customer_name": order.customer_name or "Not provided",
        "customer_phone": _mask_phone(order.customer_phone),
        "delivery_address": order.delivery_address,
        "created_at": order.created_at.isoformat(),
    }


def _format_kr(amount_ore: int) -> str:
    return f"kr {amount_ore // 100}" if amount_ore % 100 == 0 else f"kr {amount_ore / 100:.2f}"


def _ingredients_from_description(description: str | None) -> list[str]:
    cleaned = (description or "").replace("Tomatsås,", "").replace("Tomatsås", "").replace(".", "")
    return [part.strip() for part in cleaned.split(",") if part.strip()]


def _serialize_menu_item(item: MenuItem) -> dict[str, Any]:
    modifiers = dict(item.modifiers or {})
    sizes = modifiers.get("sizes") if isinstance(modifiers.get("sizes"), dict) else {}
    size_prices = {
        str(size): _format_kr(int(item.base_price) + int(delta))
        for size, delta in sizes.items()
    }
    return {
        "id": str(item.id),
        "name": item.name,
        "category": item.category,
        "base_price": item.base_price,
        "price": _format_kr(item.base_price),
        "base_price_ore": item.base_price,
        "description": item.description,
        "is_available": item.is_available,
        "allergens": item.allergens,
        "modifiers": item.modifiers,
        "sort_order": item.sort_order,
        "ingredients": _ingredients_from_description(item.description),
        "size_prices": size_prices or {"standard": _format_kr(item.base_price)},
    }


def _top_items(orders: list[Order]) -> list[dict[str, Any]]:
    counts: Counter[str] = Counter()
    revenue: defaultdict[str, int] = defaultdict(int)
    modifier_counts: defaultdict[str, int] = defaultdict(int)
    for order in orders:
        for item in order.items:
            name = str(item.get("name") or "Item")
            quantity = int(item.get("quantity") or 1)
            counts[name] += quantity
            revenue[name] += int(item.get("total_price") or 0)
            modifiers = item.get("modifiers") if isinstance(item.get("modifiers"), dict) else {}
            modifier_counts[name] += len([value for value in modifiers.values() if value])
    return [
        {
            "rank": index,
            "item": name,
            "orders": count,
            "revenue": revenue[name],
            "revenue_label": f"kr {revenue[name] // 100}",
            "avg_modifiers": round(modifier_counts[name] / count, 1) if count else 0,
        }
        for index, (name, count) in enumerate(counts.most_common(6), start=1)
    ]


def _revenue_orders(orders: list[Order]) -> list[Order]:
    return [order for order in orders if order.status in REVENUE_STATUSES]


def _sum_order_revenue(orders: list[Order]) -> int:
    return sum(max(order.total_amount, 0) for order in _revenue_orders(orders))


def _average_order_value(orders: list[Order]) -> int:
    revenue_orders = _revenue_orders(orders)
    if not revenue_orders:
        return 0
    return round(sum(max(order.total_amount, 0) for order in revenue_orders) / len(revenue_orders))


@router.get("/overview")
async def overview(session: AsyncSession = Depends(get_session)) -> dict[str, Any]:
    restaurant_id = await _restaurant_id(session)
    orders = await _orders(session, restaurant_id)
    calls = await _calls(session, restaurant_id)

    total_calls = len(calls)
    revenue_orders = _revenue_orders(orders)
    total_orders = len(revenue_orders)
    revenue = _sum_order_revenue(orders)
    missed = len([call for call in calls if call.outcome == "missed"])
    active_orders = [order for order in orders if order.status in ACTIVE_STATUSES]

    per_hour: dict[str, dict[str, int]] = {}
    for call in calls:
        label = _hour_label(call.created_at)
        per_hour.setdefault(label, {"hour": label, "calls": 0, "orders": 0})
        per_hour[label]["calls"] += 1
    for order in revenue_orders:
        label = _hour_label(order.created_at)
        per_hour.setdefault(label, {"hour": label, "calls": 0, "orders": 0})
        per_hour[label]["orders"] += 1

    return {
        "metrics": {
            "total_calls": total_calls,
            "total_orders": total_orders,
            "conversion_rate": round(total_orders / total_calls, 2) if total_calls else 0,
            "revenue": revenue,
            "revenue_order_count": len(revenue_orders),
            "avg_order_value": _average_order_value(orders),
            "missed_calls": missed,
            "active_orders": len(active_orders),
        },
        "hourly": [per_hour[key] for key in sorted(per_hour)],
        "active_calls": [
            {
                "id": call.call_uuid,
                "language": call.detected_language or "unknown",
                "duration_seconds": call.duration_seconds,
                "status": call.outcome or "unknown",
            }
            for call in calls
            if call.outcome == "handoff"
        ],
        "recent_orders": [_serialize_order(order) for order in active_orders[:4]],
    }


@router.get("/orders")
async def dashboard_orders(session: AsyncSession = Depends(get_session)) -> list[dict[str, Any]]:
    restaurant_id = await _restaurant_id(session)
    orders = await _orders(session, restaurant_id)
    return [_serialize_order(order) for order in orders]


@router.get("/menu")
async def dashboard_menu(session: AsyncSession = Depends(get_session)) -> dict[str, Any]:
    restaurant = await ensure_demo_restaurant(session)
    result = await session.execute(
        select(MenuItem)
        .where(MenuItem.restaurant_id == restaurant.id)
        .order_by(MenuItem.category, MenuItem.sort_order, MenuItem.name)
    )
    return {"restaurant_name": restaurant.name, "menu": [_serialize_menu_item(item) for item in result.scalars()]}


@router.post("/menu/item", status_code=201)
async def create_dashboard_menu_item(payload: DashboardMenuCreate, session: AsyncSession = Depends(get_session)) -> dict[str, Any]:
    restaurant = await ensure_demo_restaurant(session)
    item = MenuItem(restaurant_id=restaurant.id, **payload.model_dump())
    session.add(item)
    await session.commit()
    await session.refresh(item)
    return _serialize_menu_item(item)


@router.patch("/menu/item/{item_id}")
async def update_dashboard_menu_item(item_id: UUID, payload: DashboardMenuUpdate, session: AsyncSession = Depends(get_session)) -> dict[str, Any]:
    restaurant_id = await _restaurant_id(session)
    item = await session.get(MenuItem, item_id)
    if item is None or item.restaurant_id != restaurant_id:
        raise HTTPException(status_code=404, detail="Menu item not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    await session.commit()
    await session.refresh(item)
    return _serialize_menu_item(item)


@router.delete("/menu/item/{item_id}", status_code=204)
async def delete_dashboard_menu_item(item_id: UUID, session: AsyncSession = Depends(get_session)) -> None:
    restaurant_id = await _restaurant_id(session)
    item = await session.get(MenuItem, item_id)
    if item is None or item.restaurant_id != restaurant_id:
        raise HTTPException(status_code=404, detail="Menu item not found")
    await session.delete(item)
    await session.commit()


@router.get("/calls")
async def dashboard_calls(session: AsyncSession = Depends(get_session)) -> list[dict[str, Any]]:
    restaurant_id = await _restaurant_id(session)
    calls = await _calls(session, restaurant_id)
    return [
        {
            "id": str(call.id),
            "call_uuid": call.call_uuid,
            "customer_phone": call.customer_phone,
            "duration_seconds": call.duration_seconds,
            "transcript": call.transcript,
            "recording_url": call.recording_url,
            "detected_language": call.detected_language,
            "ai_confidence_avg": call.ai_confidence_avg,
            "outcome": call.outcome,
            "created_at": call.created_at.isoformat(),
        }
        for call in calls
    ]


@router.patch("/orders/{order_id}/status")
async def update_dashboard_order(order_id: UUID, payload: DashboardStatusUpdate, session: AsyncSession = Depends(get_session)) -> dict[str, Any]:
    restaurant_id = await _restaurant_id(session)
    order = await session.get(Order, order_id)
    if order is None or order.restaurant_id != restaurant_id:
        raise HTTPException(status_code=404, detail="Order not found")
    allowed = {"pending", "confirmed", "preparing", "ready", "completed", "delivered", "cancelled"}
    status = payload.status.lower()
    if status not in allowed:
        raise HTTPException(status_code=400, detail="Invalid order status")
    order.status = status
    await session.commit()
    await session.refresh(order)
    return _serialize_order(order)


@router.get("/analytics")
async def dashboard_analytics(session: AsyncSession = Depends(get_session)) -> dict[str, Any]:
    restaurant_id = await _restaurant_id(session)
    orders = await _orders(session, restaurant_id)
    calls = await _calls(session, restaurant_id)
    revenue_orders = _revenue_orders(orders)
    top_items = _top_items(revenue_orders)

    language_counts = Counter(call.detected_language or "unknown" for call in calls if call.outcome == "ordered")
    order_type_counts = Counter(order.order_type for order in revenue_orders)
    hourly_calls = Counter(_hour_label(call.created_at) for call in calls)
    confidence_values = [call.ai_confidence_avg for call in calls if call.ai_confidence_avg is not None]
    modified_orders = [
        order
        for order in revenue_orders
        if any(isinstance(item.get("modifiers"), dict) and any(item["modifiers"].values()) for item in order.items)
    ]

    return {
        "kpis": {
            "most_ordered": f"{top_items[0]['item']} ({top_items[0]['orders']} orders)" if top_items else "No orders yet",
            "busiest_hour": hourly_calls.most_common(1)[0][0] if hourly_calls else "n/a",
            "avg_order_value": _average_order_value(orders),
            "missed_call_recovery": round((1 - (len([call for call in calls if call.outcome == "missed"]) / len(calls))) * 100) if calls else 0,
        },
        "languages": [{"name": language.upper(), "value": count} for language, count in language_counts.most_common()],
        "order_type_split": [{"name": order_type.title(), "value": count} for order_type, count in order_type_counts.most_common()],
        "top_items": top_items,
        "ai_performance": {
            "avg_confidence": round((sum(confidence_values) / len(confidence_values)) * 100, 1) if confidence_values else 0,
            "handoffs": len([call for call in calls if call.outcome == "handoff"]),
            "orders_with_modifications": round((len(modified_orders) / len(revenue_orders)) * 100) if revenue_orders else 0,
        },
    }
