"use client";

import { useEffect, useState } from "react";

export interface CallEvent {
  type: "active_calls" | "transcript";
  value: number | string;
}

export function useWebSocket(path: string) {
  const [events, setEvents] = useState<CallEvent[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000";
    const ws = new WebSocket(`${base}${path}`);
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (message) => setEvents((old) => [JSON.parse(message.data) as CallEvent, ...old].slice(0, 50));
    return () => ws.close();
  }, [path]);

  return { connected, events };
}
