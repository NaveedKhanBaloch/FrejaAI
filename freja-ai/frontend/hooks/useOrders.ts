"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Order, OrderStatus } from "@/types";

interface DashboardOrder {
  id: string;
  items: Order["items"];
  total_amount: number;
  type: string;
  status: string;
  customer_phone: string;
  delivery_address: string | null;
  created_at: string;
}

function normalizeOrder(order: DashboardOrder): Order {
  return {
    id: order.id,
    customer_phone: order.customer_phone,
    items: order.items,
    total_amount: order.total_amount,
    order_type: order.type.toLowerCase() === "delivery" ? "delivery" : "pickup",
    delivery_address: order.delivery_address,
    status: order.status.toLowerCase() as OrderStatus,
    created_at: order.created_at,
  };
}

export function useOrders() {
  return useQuery({ queryKey: ["orders"], queryFn: async () => (await api<DashboardOrder[]>("/dashboard/orders")).map(normalizeOrder), refetchInterval: 10000 });
}

export function useLiveOrders() {
  return useQuery({
    queryKey: ["orders", "live"],
    queryFn: async () =>
      (await api<DashboardOrder[]>("/dashboard/orders"))
        .map(normalizeOrder)
        .filter((order) => ["pending", "confirmed", "preparing", "ready"].includes(order.status)),
    refetchInterval: 10000,
  });
}

export function useUpdateOrderStatus() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      api<DashboardOrder>(`/dashboard/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }).then(normalizeOrder),
    onMutate: async ({ id, status }) => {
      await client.cancelQueries({ queryKey: ["orders"] });
      const previous = client.getQueryData<Order[]>(["orders", "live"]);
      client.setQueryData<Order[]>(["orders", "live"], (old) => old?.map((order) => (order.id === id ? { ...order, status } : order)));
      return { previous };
    },
    onError: (_error, _vars, context) => client.setQueryData(["orders", "live"], context?.previous),
    onSettled: () => {
      void client.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
