"use client";

import { useEffect, useRef } from "react";
import { LiveOrderCard } from "@/components/dashboard/LiveOrderCard";
import { useLiveOrders, useUpdateOrderStatus } from "@/hooks/useOrders";

export function KitchenDisplay() {
  const { data = [] } = useLiveOrders();
  const update = useUpdateOrderStatus();
  const lastCount = useRef(0);

  useEffect(() => {
    if (data.length > lastCount.current) {
      const audio = new AudioContext();
      const osc = audio.createOscillator();
      osc.frequency.value = 880;
      osc.connect(audio.destination);
      osc.start();
      setTimeout(() => {
        osc.stop();
        void audio.close();
      }, 140);
    }
    lastCount.current = data.length;
  }, [data.length]);

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      {data.map((order) => (
        <LiveOrderCard key={order.id} order={order} onStatus={(status) => update.mutate({ id: order.id, status })} />
      ))}
    </div>
  );
}
