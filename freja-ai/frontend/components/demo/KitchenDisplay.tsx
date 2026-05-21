"use client";

import { useEffect, useState } from "react";
import { DemoOrderItem, useVoiceStore } from "@/lib/voice-simulator";

function formatOrderItem(item: string | DemoOrderItem): string {
  if (typeof item === "string") return item;

  const quantity = item.quantity ?? 1;
  const size = item.size ? `${item.size.toUpperCase()} ` : "";
  const name = item.name ?? item.id ?? "Pizza";
  const modifierValues = Array.isArray(item.modifiers)
    ? item.modifiers
    : Object.entries(item.modifiers ?? {}).flatMap(([key, value]) => {
        if (Array.isArray(value)) return value.map((entry) => `${key}: ${entry}`);
        if (value === true) return [key];
        if (value) return [`${key}: ${String(value)}`];
        return [];
      });
  const details = [...(item.toppings ?? []), ...modifierValues];
  const suffix = details.length > 0 ? ` — ${details.join(", ")}` : item.notes ? ` — ${item.notes}` : "";

  return `${quantity}× ${size}${name}${suffix}`;
}

export function KitchenDisplay() {
  const ticketReady = useVoiceStore((state) => state.ticketReady);
  const address = useVoiceStore((state) => state.address);
  const orderTicket = useVoiceStore((state) => state.orderTicket);
  const [ready, setReady] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const ticketItems = orderTicket?.items ?? ["1× LARGE HALF-AND-HALF", "½ Margherita / ½ Vesuvio", "+ Extra cheese (whole)"];

  useEffect(() => {
    if (!ticketReady) return;
    window.setTimeout(() => {
      setReady(false);
      setSeconds(0);
    }, 0);
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [ticketReady]);

  return (
    <div className="brutal-card min-h-[680px] p-5">
      <div className="mb-5 flex items-center justify-between border-b border-border pb-4">
        <div>
          <p className="font-mono text-xs uppercase text-text-3">Live kitchen display</p>
          <h3 className="mt-1 text-2xl font-bold">Pizza Palazzo</h3>
        </div>
        <span className="rounded-pill border border-accent px-3 py-1 font-mono text-xs text-accent">ONLINE</span>
      </div>
      {!ticketReady ? (
        <div className="flex h-[520px] items-center justify-center border border-dashed border-border text-center text-text-2">
          Complete the voice demo and the ticket appears here.
        </div>
      ) : (
        <article className="ticket-enter border border-accent bg-bg">
          <div className="flex justify-between border-b border-border p-5 font-mono">
            <span>ORDER {orderTicket?.id ?? "#0042"}</span>
            <span className="text-accent">{orderTicket?.type ?? "DELIVERY"}</span>
          </div>
          <div className="border-b border-border p-5 font-mono text-sm text-text-2">14:32 + {seconds}s</div>
          <div className="space-y-2 border-b border-border p-5">
            {ticketItems.map((item, index) => (
              <p key={`${index}-${formatOrderItem(item)}`} className={index === 0 ? "font-bold" : index === 2 ? "text-accent" : "text-text-2"}>
                {formatOrderItem(item)}
              </p>
            ))}
          </div>
          <div className="border-b border-border p-5 text-text-2">
            <p>{orderTicket?.address ?? address}</p>
            <p className="mt-2">ETA: {orderTicket?.eta ?? "25–35 min"}</p>
            <p className="mt-2 font-mono text-accent">{orderTicket?.total ?? "kr 159"}</p>
          </div>
          <div className="flex gap-3 p-5">
            <button onClick={() => setReady(false)} className={`flex-1 border border-border px-4 py-3 font-bold ${!ready ? "bg-accent text-bg" : "text-text-2"}`}>PREPARING</button>
            <button onClick={() => setReady(true)} className={`flex-1 border border-border px-4 py-3 font-bold ${ready ? "bg-accent text-bg" : "text-text-2"}`}>READY</button>
          </div>
        </article>
      )}
    </div>
  );
}
