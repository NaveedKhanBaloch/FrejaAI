"use client";

import { Activity } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useWebSocket } from "@/hooks/useWebSocket";

export function CallMonitor() {
  const { connected, events } = useWebSocket("/calls/monitor");
  const active = events.find((event) => event.type === "active_calls")?.value ?? 0;
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-600">Active calls</div>
          <div className="mt-1 text-3xl font-bold">{active}</div>
        </div>
        <Activity className={connected ? "text-accent" : "text-gray-400"} />
      </div>
    </Card>
  );
}
