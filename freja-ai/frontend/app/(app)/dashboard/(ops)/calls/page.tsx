"use client";

import { Download } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useCalls } from "@/hooks/useCalls";

export default function CallsPage() {
  const { data = [] } = useCalls();
  const [expanded, setExpanded] = useState<string | null>(null);
  const csv = useMemo(() => ["uuid,phone,language,outcome,created_at", ...data.map((call) => [call.call_uuid, call.customer_phone ?? "", call.detected_language ?? "", call.outcome ?? "", call.created_at].join(","))].join("\n"), [data]);
  return (
    <div className="grid gap-4">
      <a href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`} download="freja-calls.csv"><Button><Download size={16} /> Export CSV</Button></a>
      {data.map((call) => (
        <Card key={call.id} onClick={() => setExpanded(expanded === call.id ? null : call.id)} className="cursor-pointer">
          <div className="grid gap-2 md:grid-cols-5">
            <span>{call.customer_phone ?? "Unknown"}</span>
            <span>{call.detected_language ?? "n/a"}</span>
            <span>{call.outcome ?? "open"}</span>
            <span>{call.duration_seconds}s</span>
            <span>{new Date(call.created_at).toLocaleString()}</span>
          </div>
          {expanded === call.id && <div className="mt-4 border-t border-border pt-4 text-sm">{call.transcript ?? "No transcript yet"}{call.recording_url && <audio className="mt-3 w-full" src={call.recording_url} controls />}</div>}
        </Card>
      ))}
    </div>
  );
}
