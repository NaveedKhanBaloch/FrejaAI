from typing import Any


DEMO_MENU: list[dict[str, Any]] = [
    {
        "id": "margherita",
        "name": "Margherita",
        "category": "pizza",
        "base_price": 13900,
        "description": "Tomato, mozzarella, fresh basil",
        "is_available": True,
        "allergens": ["gluten", "milk"],
        "modifiers": {
            "sizes": {"medium": 0, "large": 3000},
            "toppings": {"extra cheese": 2000},
            "half_and_half": True,
        },
    },
    {
        "id": "vesuvio",
        "name": "Vesuvio",
        "category": "pizza",
        "base_price": 14900,
        "description": "Tomato, mozzarella, smoked ham",
        "is_available": True,
        "allergens": ["gluten", "milk"],
        "modifiers": {"sizes": {"medium": 0, "large": 3000}, "toppings": {"extra cheese": 2000}},
    },
    {
        "id": "kebabpizza",
        "name": "Kebabpizza",
        "category": "pizza",
        "base_price": 17900,
        "description": "Kebab, onion, tomato, garlic sauce",
        "is_available": True,
        "allergens": ["gluten", "milk"],
        "modifiers": {"sizes": {"medium": 0, "large": 3000}, "toppings": {"no onion": 0, "extra sauce": 1000}},
    },
]
