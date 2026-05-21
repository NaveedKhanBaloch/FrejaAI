import json
import re
from datetime import datetime, timezone
from typing import Any

import httpx
from rapidfuzz import fuzz, process
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.order_builder import BuiltOrderItem, MenuValidationError, OrderBuilder
from app.ai.prompts.system_prompt import build_system_prompt
from app.config import get_settings
from app.models.call_log import CallLog
from app.models.menu import MenuItem
from app.models.order import Order
from app.models.restaurant import Restaurant
from app.services.demo_menu import DEMO_MENU
from app.services.restaurant_seed import ensure_demo_restaurant


SIZE_ALIASES: dict[str, tuple[str, ...]] = {
    "standard": ("standard", "normal", "vanlig", "medium", "mellan"),
    "familj": ("familj", "family", "familjepizza", "family size"),
    "large": ("large", "stor"),
}


class ElevenLabsAgentService:
    def __init__(self) -> None:
        self._settings = get_settings()

    async def get_signed_url(self) -> str:
        if not self._settings.elevenlabs_agent_id:
            raise ValueError("ELEVENLABS_AGENT_ID is not configured")
        url = "https://api.elevenlabs.io/v1/convai/conversation/get-signed-url"
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(
                url,
                params={"agent_id": self._settings.elevenlabs_agent_id},
                headers={"xi-api-key": self._settings.elevenlabs_api_key},
            )
        response.raise_for_status()
        payload = response.json()
        signed_url = payload.get("signed_url")
        if not isinstance(signed_url, str) or not signed_url:
            raise ValueError("ElevenLabs did not return a signed_url")
        return signed_url

    async def get_conversation_token(self) -> str:
        if not self._settings.elevenlabs_agent_id:
            raise ValueError("ELEVENLABS_AGENT_ID is not configured")
        url = "https://api.elevenlabs.io/v1/convai/conversation/token"
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(
                url,
                params={"agent_id": self._settings.elevenlabs_agent_id},
                headers={"xi-api-key": self._settings.elevenlabs_api_key},
            )
        response.raise_for_status()
        payload = response.json()
        token = payload.get("token")
        if not isinstance(token, str) or not token:
            raise ValueError("ElevenLabs did not return a conversation token")
        return token

    def agent_id(self) -> str:
        if not self._settings.elevenlabs_agent_id:
            raise ValueError("ELEVENLABS_AGENT_ID is not configured")
        return self._settings.elevenlabs_agent_id

    async def demo_prompt(self, session: AsyncSession | None = None) -> str:
        menu = await self.get_menu_items(session) if session is not None else DEMO_MENU
        base_prompt = build_system_prompt(
            self._settings.demo_restaurant_name,
            menu,
            "sv",
            {"items": [], "order_type": None, "delivery_address": None, "total_amount": 0},
            datetime.now(timezone.utc),
        )
        return (
            base_prompt
            + "\n\nVOICE AGENT TOOL RULES:\n"
            + "Use the configured tools as the source of truth. Do not guess prices or availability.\n"
            + "Only speak prices from fields ending in _label or from kr-formatted strings. Never speak raw integer money values from backend records.\n"
            + "Call get_menu before listing available menu items if you are unsure.\n"
            + "Call validate_item before confirming an item or modifier.\n"
            + "Call confirm_order only after the customer clearly approves the final summary.\n"
            + "For pickup orders, never ask for a delivery address.\n"
            + "For delivery orders, collect the delivery address before confirmation.\n"
            + "When the order is confirmed, tell the customer professionally that the order is placed and they should enjoy the pizza, then end the call.\n"
        )

    async def get_restaurant(self, session: AsyncSession) -> Restaurant:
        result = await session.execute(select(Restaurant).where(Restaurant.name == self._settings.demo_restaurant_name, Restaurant.is_active.is_(True)))
        restaurant = result.scalar_one_or_none()
        return restaurant or await ensure_demo_restaurant(session)

    async def get_menu_items(self, session: AsyncSession, include_unavailable: bool = False) -> list[dict[str, Any]]:
        restaurant = await self.get_restaurant(session)
        filters = [MenuItem.restaurant_id == restaurant.id]
        if not include_unavailable:
            filters.append(MenuItem.is_available.is_(True))
        result = await session.execute(
            select(MenuItem)
            .where(*filters)
            .order_by(MenuItem.category, MenuItem.sort_order, MenuItem.name)
        )
        items = list(result.scalars())
        return [
            {
                "id": item.id,
                "name": item.name,
                "category": item.category,
                "base_price": item.base_price,
                "description": item.description,
                "is_available": item.is_available,
                "allergens": item.allergens,
                "modifiers": item.modifiers,
                "sort_order": item.sort_order,
            }
            for item in items
        ]

    async def get_menu(self, session: AsyncSession) -> dict[str, Any]:
        restaurant = await self.get_restaurant(session)
        menu = await self.get_menu_items(session)
        return {"restaurant_name": restaurant.name, "menu": [self._serialize_menu_item(item) for item in menu]}

    async def validate_item(self, session: AsyncSession, item_name: str, quantity: int = 1, modifiers: dict[str, Any] | None = None) -> dict[str, Any]:
        item = await self._build_validated_item(session, item_name, quantity, modifiers or {})
        return {
            "valid": True,
            "item": {
                "name": item.name,
                "quantity": item.quantity,
                "unit_price_label": self._format_kr(item.unit_price),
                "total_price_label": self._format_kr(item.total_price),
                "selected_size": item.modifiers.get("size") if item.modifiers else None,
                "modifiers": item.modifiers,
                "allergens": item.allergens,
            },
            "message": f"{item.quantity} x {item.name} is available for {self._format_kr(item.total_price)}.",
        }

    async def confirm_order(self, session: AsyncSession, order: dict[str, Any]) -> dict[str, Any]:
        restaurant = await self.get_restaurant(session)
        order_type = str(order.get("type") or order.get("order_type") or "").lower()
        if order_type not in {"pickup", "delivery", "avhämtning", "leverans"}:
            raise MenuValidationError("Order type must be pickup or delivery")
        normalized_type = "delivery" if order_type in {"delivery", "leverans"} else "pickup"
        address = order.get("address") or order.get("delivery_address")
        if normalized_type == "delivery" and not address:
            raise MenuValidationError("Delivery address is required for delivery orders")

        items = order.get("items")
        if not isinstance(items, list) or not items:
            raise MenuValidationError("Order must include at least one item")

        saved_items: list[dict[str, Any]] = []
        ticket_items: list[dict[str, Any]] = []
        total_amount = 0
        for raw_item in items:
            name, quantity, modifiers = self._extract_item(raw_item)
            built = await self._build_validated_item(session, name, quantity, modifiers)
            saved_items.append(
                {
                    "menu_item_id": str(built.menu_item_id),
                    "name": built.name,
                    "quantity": built.quantity,
                    "unit_price": built.unit_price,
                    "total_price": built.total_price,
                    "unit_price_label": self._format_kr(built.unit_price),
                    "total_price_label": self._format_kr(built.total_price),
                    "modifiers": built.modifiers,
                    "allergens": built.allergens,
                }
            )
            ticket_items.append(
                {
                    "name": built.name,
                    "quantity": built.quantity,
                    "unit_price_label": self._format_kr(built.unit_price),
                    "total_price_label": self._format_kr(built.total_price),
                    "modifiers": built.modifiers,
                    "allergens": built.allergens,
                }
            )
            total_amount += built.total_price

        call_log = CallLog(
            restaurant_id=restaurant.id,
            call_uuid=f"elevenlabs-{datetime.now(timezone.utc).timestamp()}",
            customer_phone=str(order.get("customer_phone") or "unknown"),
            duration_seconds=int(order.get("duration_seconds") or 0),
            transcript=str(order.get("transcript") or "Order confirmed by ElevenLabs voice agent."),
            recording_url=order.get("recording_url") if isinstance(order.get("recording_url"), str) else None,
            detected_language=str(order.get("language") or order.get("detected_language") or "sv"),
            ai_confidence_avg=float(order.get("confidence") or 0.92),
            outcome="ordered",
        )
        session.add(call_log)
        await session.flush()

        saved_order = Order(
            restaurant_id=restaurant.id,
            call_log_id=call_log.id,
            customer_phone=str(order.get("customer_phone") or "unknown"),
            items=saved_items,
            total_amount=total_amount,
            order_type=normalized_type,
            delivery_address=str(address) if normalized_type == "delivery" else None,
            status="confirmed",
            confirmed_at=datetime.now(timezone.utc),
        )
        session.add(saved_order)
        await session.commit()
        await session.refresh(saved_order)

        ticket = {
            "id": f"#{str(saved_order.id)[:4].upper()}",
            "order_id": str(saved_order.id),
            "type": normalized_type.upper(),
            "items": ticket_items,
            "address": str(address) if normalized_type == "delivery" else None,
            "eta": "25-35 min" if normalized_type == "delivery" else "15-20 min",
            "total": self._format_kr(total_amount),
        }
        return {
            "confirmed": True,
            "ticket": ticket,
            "message": f"Order confirmed. Total {ticket['total']}.",
        }

    def _serialize_menu_item(self, item: dict[str, Any]) -> dict[str, Any]:
        modifiers = dict(item.get("modifiers") or {})
        sizes = modifiers.get("sizes") if isinstance(modifiers.get("sizes"), dict) else {}
        size_prices = {
            str(size): self._format_kr(int(item["base_price"]) + int(delta))
            for size, delta in sizes.items()
        }
        available_sizes = self._available_sizes(item)
        toppings = modifiers.get("toppings") if isinstance(modifiers.get("toppings"), dict) else {}
        sauces = modifiers.get("sauces") if isinstance(modifiers.get("sauces"), dict) else {}
        return {
            "id": str(item["id"]),
            "name": item["name"],
            "category": item["category"],
            "description": item.get("description"),
            "is_available": bool(item.get("is_available", True)),
            "allergens": item.get("allergens", []),
            "sort_order": item.get("sort_order", 0),
            "price_label": self._format_kr(int(item["base_price"])),
            "ingredients": self._ingredients_from_description(str(item.get("description") or "")),
            "size_prices": size_prices or {"standard": self._format_kr(int(item["base_price"]))},
            "available_sizes": available_sizes,
            "available_toppings": [str(name) for name in toppings],
            "available_sauces": [str(name) for name in sauces],
            "allows_half_and_half": bool(modifiers.get("half_and_half")),
        }

    async def _build_validated_item(
        self,
        session: AsyncSession,
        item_name: str,
        quantity: int,
        modifiers: dict[str, Any],
    ) -> BuiltOrderItem:
        all_items = await self.get_menu_items(session, include_unavailable=True)
        cleaned_name, size_from_name = self._extract_size_from_name(item_name)
        if size_from_name and "size" not in modifiers:
            modifiers = {**modifiers, "size": size_from_name}
        known_item = self._find_known_item(cleaned_name, all_items)
        if known_item is not None and not bool(known_item.get("is_available", True)):
            raise MenuValidationError(f"{known_item['name']} is currently unavailable.")
        if known_item is None:
            builder = OrderBuilder([item for item in all_items if item.get("is_available", True)])
            return builder.add_item(cleaned_name, quantity, self._normalize_modifiers(modifiers))
        modifiers = self._normalize_modifiers(modifiers, known_item)
        builder = OrderBuilder([item for item in all_items if item.get("is_available", True)])
        return builder.add_item(str(known_item["name"]), quantity, modifiers)

    def _available_sizes(self, item: dict[str, Any]) -> list[dict[str, Any]]:
        modifiers = dict(item.get("modifiers") or {})
        sizes = modifiers.get("sizes") if isinstance(modifiers.get("sizes"), dict) else {}
        if not sizes:
            return [
                {
                    "name": "standard",
                    "price_label": self._format_kr(int(item["base_price"])),
                    "spoken_aliases": list(SIZE_ALIASES["standard"]),
                }
            ]
        return [
            {
                "name": str(size),
                "price_label": self._format_kr(int(item["base_price"]) + int(delta)),
                "spoken_aliases": list(SIZE_ALIASES.get(str(size), (str(size),))),
            }
            for size, delta in sizes.items()
        ]

    def _ingredients_from_description(self, description: str) -> list[str]:
        cleaned = (
            description.replace("Tomatsås,", "")
            .replace("tomatsås,", "")
            .replace("Tomatsås", "")
            .replace("tomatsås", "")
            .replace(".", "")
        )
        return [part.strip() for part in cleaned.split(",") if part.strip()]

    def _find_known_item(self, requested_name: str, menu_items: list[dict[str, Any]]) -> dict[str, Any] | None:
        choices: dict[str, dict[str, Any]] = {}
        for item in menu_items:
            name = str(item["name"]).casefold()
            choices[name] = item
            choices[name.replace("gher", "gar")] = item
            choices[name.replace("gh", "g")] = item
        match = process.extractOne(requested_name.casefold(), choices.keys(), scorer=fuzz.WRatio, score_cutoff=85)
        return choices[match[0]] if match else None

    def _extract_item(self, item: Any) -> tuple[str, int, dict[str, Any]]:
        if isinstance(item, str):
            return item, 1, {}
        if not isinstance(item, dict):
            raise MenuValidationError("Invalid order item")
        name = str(item.get("name") or item.get("id") or "")
        quantity = int(item.get("quantity") or 1)
        modifiers = dict(item.get("modifiers") or {})
        if item.get("size"):
            modifiers["size"] = str(item["size"]).lower()
        toppings = item.get("toppings")
        if isinstance(toppings, list):
            modifiers["add_toppings"] = [str(topping).lower() for topping in toppings]
        return name, quantity, self._normalize_modifiers(modifiers)

    def _normalize_modifiers(self, modifiers: dict[str, Any], menu_item: dict[str, Any] | None = None) -> dict[str, Any]:
        normalized = dict(modifiers)
        if isinstance(normalized.get("modifiers"), list):
            values = [str(value).lower() for value in normalized.pop("modifiers")]
            if "extra cheese" in values:
                normalized["add_toppings"] = [*normalized.get("add_toppings", []), "extra cheese"]
            if "no onion" in values:
                normalized["remove_toppings"] = [*normalized.get("remove_toppings", []), "no onion"]
        for key in ("add_toppings", "remove_toppings"):
            if isinstance(normalized.get(key), list):
                normalized[key] = [str(value).lower() for value in normalized[key]]
        if isinstance(normalized.get("size"), str):
            normalized["size"] = self._normalize_size(normalized["size"], menu_item)
        return normalized

    def _normalize_size(self, requested_size: str, menu_item: dict[str, Any] | None = None) -> str:
        requested = requested_size.strip().casefold().replace("_", " ").replace("-", " ")
        requested = re.sub(r"\s+", " ", requested)
        available_sizes = self._available_size_names(menu_item)
        if requested in available_sizes:
            return requested
        for canonical, aliases in SIZE_ALIASES.items():
            if requested == canonical or requested in aliases:
                if canonical in available_sizes:
                    return canonical
                if canonical == "standard":
                    if "medium" in available_sizes:
                        return "medium"
                    if available_sizes:
                        return sorted(available_sizes)[0]
        return requested

    def _available_size_names(self, menu_item: dict[str, Any] | None) -> set[str]:
        if menu_item is None:
            return set(SIZE_ALIASES)
        modifiers = dict(menu_item.get("modifiers") or {})
        sizes = modifiers.get("sizes") if isinstance(modifiers.get("sizes"), dict) else {}
        if not sizes:
            return {"standard"}
        return {str(size).casefold() for size in sizes}

    def _extract_size_from_name(self, requested_name: str) -> tuple[str, str | None]:
        normalized = requested_name.strip()
        lowered = normalized.casefold()
        phrase_aliases = sorted(
            ((alias, canonical) for canonical, aliases in SIZE_ALIASES.items() for alias in aliases),
            key=lambda pair: len(pair[0]),
            reverse=True,
        )
        for alias, canonical in phrase_aliases:
            pattern = rf"(^|\s){re.escape(alias)}(\s|$)"
            if re.search(pattern, lowered):
                cleaned = re.sub(pattern, " ", lowered).strip()
                cleaned = re.sub(r"\s+", " ", cleaned)
                return cleaned or normalized, canonical
        return normalized, None

    def _format_kr(self, amount_ore: int) -> str:
        return f"kr {amount_ore // 100}" if amount_ore % 100 == 0 else f"kr {amount_ore / 100:.2f}"

    def tool_result(self, payload: dict[str, Any]) -> str:
        return json.dumps(payload, ensure_ascii=False)
