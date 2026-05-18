"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { api } from "@/lib/api";
import { money } from "@/lib/utils";
import type { MenuItem } from "@/types";

export function MenuManager() {
  const client = useQueryClient();
  const { data = [], error, isError, isLoading } = useQuery({ queryKey: ["menu"], queryFn: () => api<MenuItem[]>("/menu"), retry: 1 });
  const toggle = useMutation({
    mutationFn: (item: MenuItem) => api<MenuItem>(`/menu/item/${item.id}`, { method: "PATCH", body: JSON.stringify({ is_available: !item.is_available }) }),
    onSuccess: () => client.invalidateQueries({ queryKey: ["menu"] }),
  });

  return (
    <div className="grid gap-4">
      {isLoading && <Card className="text-sm text-gray-600">Loading menu...</Card>}
      {isError && (
        <Card className="border-amber-200 bg-amber-50 text-sm text-amber-900">
          Menu data is unavailable. Start the backend on port 8000 and sign in to load restaurant menu items.
          <div className="mt-2 text-xs text-amber-800">{error instanceof Error ? error.message : "Unknown request error"}</div>
        </Card>
      )}
      {data.map((item) => (
        <Card key={item.id} className="grid gap-4 md:grid-cols-[1fr_140px_180px] md:items-center">
          <div>
            <div className="font-semibold">{item.name}</div>
            <div className="mt-1 text-sm text-gray-600">{item.category} · {item.description}</div>
            <pre className="mt-3 max-h-24 overflow-auto rounded bg-surface p-2 text-xs">{JSON.stringify(item.modifiers, null, 2)}</pre>
          </div>
          <div className="font-semibold">{money(item.base_price)}</div>
          <Button onClick={() => toggle.mutate(item)} className={item.is_available ? "" : "bg-gray-700"}>
            <Save size={16} /> {item.is_available ? "Available" : "Hidden"}
          </Button>
        </Card>
      ))}
    </div>
  );
}
