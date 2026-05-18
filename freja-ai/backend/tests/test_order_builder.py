from uuid import uuid4

import pytest

from app.ai.order_builder import MenuValidationError, OrderBuilder


def menu() -> list[dict[str, object]]:
    return [
        {
            "id": uuid4(),
            "name": "Margherita Pizza",
            "category": "pizza",
            "base_price": 9900,
            "is_available": True,
            "allergens": ["gluten", "milk"],
            "modifiers": {"sizes": {"large": 2500}, "crusts": {"thin": 0}, "toppings": {"olives": 900}, "extra_cheese": 1200},
        },
        {
            "id": uuid4(),
            "name": "Cola",
            "category": "drinks",
            "base_price": 2500,
            "is_available": True,
            "allergens": [],
            "modifiers": {},
        },
        {
            "id": uuid4(),
            "name": "Lunch Combo",
            "category": "combo",
            "base_price": 11900,
            "is_available": True,
            "allergens": [],
            "modifiers": {"combo_items": ["Margherita Pizza", "Cola"]},
        },
    ]


def test_add_pizza_with_modifiers_prices_in_cents() -> None:
    builder = OrderBuilder(menu())

    item = builder.add_item("margarita", 2, {"size": "large", "crust": "thin", "add_toppings": ["olives"], "extra_cheese": True})

    assert item.name == "Margherita Pizza"
    assert item.unit_price == 14500
    assert builder.total_amount == 29000
    assert "gluten" in item.allergens


def test_rejects_hallucinated_menu_items() -> None:
    builder = OrderBuilder(menu())

    with pytest.raises(MenuValidationError):
        builder.add_item("sushi platter")


def test_combo_expands_to_individual_items() -> None:
    builder = OrderBuilder(menu())

    builder.add_item("lunch combo")

    assert [item.name for item in builder.items] == ["Margherita Pizza", "Cola"]
