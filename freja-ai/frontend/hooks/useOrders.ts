"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, eventSource } from "@/lib/api";
import type { Order, OrderStatus } from "@/types";

export function useOrders() {
  return useQuery({ queryKey: ["orders"], queryFn: () => api<Order[]>("/orders") });
}

export function useLiveOrders() {
  const query = useQuery({ queryKey: ["orders", "live"], queryFn: () => api<Order[]>("/orders") });
  const client = useQueryClient();

  useEffect(() => {
    const source = eventSource("/orders/live");
    source.addEventListener("orders", (event) => {
      client.setQueryData(["orders", "live"], JSON.parse((event as MessageEvent).data) as Order[]);
    });
    return () => source.close();
  }, [client]);
  return query;
}

export function useUpdateOrderStatus() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      api<Order>(`/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
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
