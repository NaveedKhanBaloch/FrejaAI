"use client";

import { LiveOrderCard } from "@/components/dashboard/LiveOrderCard";
import { useOrders, useUpdateOrderStatus } from "@/hooks/useOrders";

export default function OrdersPage() {
  const { data = [] } = useOrders();
  const update = useUpdateOrderStatus();
  return <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">{data.map((order) => <LiveOrderCard key={order.id} order={order} onStatus={(status) => update.mutate({ id: order.id, status })} />)}</div>;
}
