from uuid import uuid4

import pytest

from app.ai.order_builder import MenuValidationError
from app.services.elevenlabs_agent_service import ElevenLabsAgentService


def pizza_item() -> dict[str, object]:
    return {
        "id": uuid4(),
        "name": "Kebabpizza",
        "category": "Kebabpizzor",
        "base_price": 14500,
        "description": "Tomatsås, ost och kebabkött.",
        "is_available": True,
        "allergens": ["gluten", "milk"],
        "modifiers": {"sizes": {"standard": 0, "familj": 26000}},
        "sort_order": 10,
    }


def test_size_aliases_match_swedish_menu_sizes() -> None:
    service = ElevenLabsAgentService()
    item = pizza_item()

    assert service._normalize_size("medium", item) == "standard"
    assert service._normalize_size("normal", item) == "standard"
    assert service._normalize_size("family", item) == "familj"
    assert service._normalize_size("familjepizza", item) == "familj"


def test_menu_serialization_exposes_formatted_size_prices_only() -> None:
    service = ElevenLabsAgentService()

    serialized = service._serialize_menu_item(pizza_item())

    assert serialized["price_label"] == "kr 145"
    assert serialized["size_prices"] == {"standard": "kr 145", "familj": "kr 405"}
    assert {"name": "familj", "price_label": "kr 405", "spoken_aliases": ["familj", "family", "familjepizza", "family size"]} in serialized["available_sizes"]
    assert "base_price" not in serialized


def test_order_type_resolution_uses_known_conversation_values() -> None:
    service = ElevenLabsAgentService()

    assert service._resolve_order_type({"order_type": "pickup"}) == "pickup"
    assert service._resolve_order_type({"type": "leverans"}) == "delivery"
    assert service._resolve_order_type({"delivery_address": "Drottninggatan 42"}) == "delivery"
    assert service._resolve_order_type({"summary": "The customer said it is for pickup."}) == "pickup"
    assert service._resolve_order_type({"items": [{"name": "Vesuvio"}]}) == "pickup"


def test_order_idempotency_prefers_explicit_call_key() -> None:
    service = ElevenLabsAgentService()

    assert service._order_idempotency_key({"clientOrderId": "abc-123"}) == "elevenlabs-abc-123"
    assert service._order_idempotency_key({"conversation_id": "conv-42"}) == "elevenlabs-conv-42"


def test_extract_item_preserves_selected_size_from_tool_payload() -> None:
    service = ElevenLabsAgentService()

    name, quantity, modifiers = service._extract_item(
        {
            "item": {"name": "Pepperoni Pizza", "selected_size": "large"},
            "quantity": 2,
        }
    )

    assert name == "Pepperoni Pizza"
    assert quantity == 2
    assert modifiers["size"] == "large"


@pytest.mark.asyncio
async def test_validate_item_uses_requested_size_price(monkeypatch: pytest.MonkeyPatch) -> None:
    service = ElevenLabsAgentService()

    async def fake_menu_items(_session: object, include_unavailable: bool = False) -> list[dict[str, object]]:
        return [pizza_item()]

    monkeypatch.setattr(service, "get_menu_items", fake_menu_items)

    standard = await service.validate_item(object(), "Kebabpizza", 1, {"size": "medium"})  # type: ignore[arg-type]
    family = await service.validate_item(object(), "Kebabpizza", 1, {"size": "family"})  # type: ignore[arg-type]

    assert standard["item"]["unit_price_label"] == "kr 145"
    assert standard["item"]["selected_size"] == "standard"
    assert family["item"]["unit_price_label"] == "kr 405"
    assert family["item"]["selected_size"] == "familj"


@pytest.mark.asyncio
async def test_confirm_order_requires_customer_name_and_phone(monkeypatch: pytest.MonkeyPatch) -> None:
    service = ElevenLabsAgentService()

    class RestaurantStub:
        id = uuid4()

    async def fake_restaurant(_session: object) -> RestaurantStub:
        return RestaurantStub()

    monkeypatch.setattr(service, "get_restaurant", fake_restaurant)

    with pytest.raises(MenuValidationError, match="Customer name is required"):
        await service.confirm_order(object(), {"items": [{"name": "Kebabpizza"}], "orderType": "pickup"})  # type: ignore[arg-type]

    with pytest.raises(MenuValidationError, match="Customer phone number is required"):
        await service.confirm_order(object(), {"items": [{"name": "Kebabpizza"}], "orderType": "pickup", "customerName": "Naveed"})  # type: ignore[arg-type]
