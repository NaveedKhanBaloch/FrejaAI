from app.models.order import Order
from app.routers.dashboard import _average_order_value, _revenue_orders, _sum_order_revenue


def make_order(total_amount: int, status: str) -> Order:
    return Order(total_amount=total_amount, status=status, order_type="pickup", customer_phone="+461234567")


def test_revenue_metrics_use_only_placed_orders() -> None:
    orders = [
        make_order(16900, "confirmed"),
        make_order(2000, "ready"),
        make_order(12000, "completed"),
        make_order(99900, "cancelled"),
        make_order(5000, "pending"),
    ]

    assert len(_revenue_orders(orders)) == 3
    assert _sum_order_revenue(orders) == 30900
    assert _average_order_value(orders) == 10300


def test_average_order_value_is_zero_without_placed_orders() -> None:
    orders = [
        make_order(99900, "cancelled"),
        make_order(5000, "pending"),
    ]

    assert _sum_order_revenue(orders) == 0
    assert _average_order_value(orders) == 0
