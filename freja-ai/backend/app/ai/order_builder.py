from dataclasses import dataclass, field
from typing import Any
from uuid import UUID

from rapidfuzz import fuzz, process


@dataclass(slots=True)
class BuiltOrderItem:
    menu_item_id: UUID
    name: str
    quantity: int
    unit_price: int
    total_price: int
    modifiers: dict[str, Any] = field(default_factory=dict)
    allergens: list[str] = field(default_factory=list)


class MenuValidationError(ValueError):
    pass


class OrderBuilder:
    def __init__(self, menu_items: list[dict[str, Any]]) -> None:
        self._menu = menu_items
        self._items: list[BuiltOrderItem] = []

    @property
    def items(self) -> list[BuiltOrderItem]:
        return list(self._items)

    @property
    def total_amount(self) -> int:
        return sum(item.total_price for item in self._items)

    def find_menu_item(self, requested_name: str) -> dict[str, Any]:
        available = [item for item in self._menu if item.get("is_available", True)]
        choices: dict[str, dict[str, Any]] = {}
        for item in available:
            for variant in self._name_variants(str(item["name"])):
                choices[variant] = item
        match = process.extractOne(requested_name.casefold(), choices.keys(), scorer=fuzz.WRatio, score_cutoff=85)
        if match is None:
            raise MenuValidationError(f"Menu item not found: {requested_name}")
        return choices[match[0]]

    def _name_variants(self, name: str) -> set[str]:
        normalized = name.casefold()
        variants = {normalized}
        variants.add(normalized.replace("gher", "gar"))
        variants.add(normalized.replace("gh", "g"))
        return variants

    def add_item(self, requested_name: str, quantity: int = 1, modifiers: dict[str, Any] | None = None) -> BuiltOrderItem:
        if quantity < 1:
            raise MenuValidationError("Quantity must be at least 1")
        menu_item = self.find_menu_item(requested_name)
        resolved = self._expand_combo(menu_item, quantity, modifiers or {})
        self._items.extend(resolved)
        return resolved[0]

    def remove_item(self, requested_name: str) -> None:
        menu_item = self.find_menu_item(requested_name)
        before = len(self._items)
        self._items = [item for item in self._items if item.menu_item_id != menu_item["id"]]
        if len(self._items) == before:
            raise MenuValidationError(f"Item is not in order: {requested_name}")

    def update_quantity(self, requested_name: str, quantity: int) -> BuiltOrderItem:
        if quantity < 1:
            raise MenuValidationError("Quantity must be at least 1")
        menu_item = self.find_menu_item(requested_name)
        for item in self._items:
            if item.menu_item_id == menu_item["id"]:
                item.quantity = quantity
                item.total_price = self._price_item(menu_item, item.modifiers) * quantity
                return item
        raise MenuValidationError(f"Item is not in order: {requested_name}")

    def _expand_combo(
        self,
        menu_item: dict[str, Any],
        quantity: int,
        modifiers: dict[str, Any],
    ) -> list[BuiltOrderItem]:
        combo_items = menu_item.get("modifiers", {}).get("combo_items")
        if not combo_items:
            return [self._build_item(menu_item, quantity, modifiers)]
        expanded: list[BuiltOrderItem] = []
        for combo_name in combo_items:
            child = self.find_menu_item(str(combo_name))
            expanded.append(self._build_item(child, quantity, {"combo_parent": menu_item["name"]}))
        return expanded

    def _build_item(self, menu_item: dict[str, Any], quantity: int, modifiers: dict[str, Any]) -> BuiltOrderItem:
        self._validate_pizza_modifiers(menu_item, modifiers)
        unit_price = self._price_item(menu_item, modifiers)
        return BuiltOrderItem(
            menu_item_id=menu_item["id"],
            name=str(menu_item["name"]),
            quantity=quantity,
            unit_price=unit_price,
            total_price=unit_price * quantity,
            modifiers=modifiers,
            allergens=list(menu_item.get("allergens", [])),
        )

    def _price_item(self, menu_item: dict[str, Any], modifiers: dict[str, Any]) -> int:
        price = int(menu_item["base_price"])
        modifier_catalog = menu_item.get("modifiers", {})
        size = modifiers.get("size")
        if size:
            price += int(modifier_catalog.get("sizes", {}).get(size, 0))
        crust = modifiers.get("crust")
        if crust:
            price += int(modifier_catalog.get("crusts", {}).get(crust, 0))
        toppings = modifiers.get("add_toppings", [])
        for topping in toppings:
            price += int(modifier_catalog.get("toppings", {}).get(topping, 0))
        if modifiers.get("extra_cheese"):
            price += int(modifier_catalog.get("extra_cheese", 0))
        return price

    def _validate_pizza_modifiers(self, menu_item: dict[str, Any], modifiers: dict[str, Any]) -> None:
        allowed = menu_item.get("modifiers", {})
        for key, catalog_key in (("size", "sizes"), ("crust", "crusts")):
            value = modifiers.get(key)
            if value and value not in allowed.get(catalog_key, {}):
                raise MenuValidationError(f"Invalid {key}: {value}")
        for key in ("add_toppings", "remove_toppings"):
            for topping in modifiers.get(key, []):
                if topping not in allowed.get("toppings", {}):
                    raise MenuValidationError(f"Invalid topping: {topping}")
        split = modifiers.get("half_and_half")
        if split:
            for side in ("left", "right"):
                for topping in split.get(side, []):
                    if topping not in allowed.get("toppings", {}):
                        raise MenuValidationError(f"Invalid {side} topping: {topping}")

    def as_json(self) -> dict[str, Any]:
        return {
            "items": [
                {
                    "menu_item_id": str(item.menu_item_id),
                    "name": item.name,
                    "quantity": item.quantity,
                    "unit_price": item.unit_price,
                    "total_price": item.total_price,
                    "modifiers": item.modifiers,
                    "allergens": item.allergens,
                }
                for item in self._items
            ],
            "total_amount": self.total_amount,
        }
