"use client";

import { Check, Clock, PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { money } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types";

export function LiveOrderCard({ order, onStatus }: { order: Order; onStatus: (status: OrderStatus) => void }) {
  const next = order.status === "ready" ? "completed" : order.status === "preparing" ? "ready" : "preparing";
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className={order.order_type === "delivery" ? "rounded bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800" : "rounded bg-sky-100 px-2 py-1 text-xs font-bold text-sky-800"}>{order.order_type}</span>
            <span className="rounded bg-surface px-2 py-1 text-xs font-bold">{order.status}</span>
          </div>
          <div className="mt-3 text-sm text-gray-600">{order.customer_phone}</div>
        </div>
        <div className="text-right font-semibold">{money(order.total_amount)}</div>
      </div>
      <ul className="mt-4 space-y-2">
        {order.items.map((item, index) => (
          <li key={`${item.name}-${index}`} className="flex justify-between text-sm">
            <span>{item.quantity} x {item.name}</span>
            <span>{money(item.total_price)}</span>
          </li>
        ))}
      </ul>
      <Button className="mt-4 w-full" onClick={() => onStatus(next)}>
        {next === "ready" ? <PackageCheck size={16} /> : next === "completed" ? <Check size={16} /> : <Clock size={16} />}
        {next}
      </Button>
    </Card>
  );
}
