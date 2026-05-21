"use client";

import dynamic from "next/dynamic";
import { Fragment, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { create } from "zustand";
import { api } from "@/lib/api";
import { money } from "@/lib/utils";
import { MenuAdmin } from "./MenuAdmin";

const ChartPanel = dynamic(() => import("./charts").then((module) => module.ChartPanel), { ssr: false });
const AnalyticsCharts = dynamic(() => import("./charts").then((module) => module.AnalyticsCharts), { ssr: false });

type Tab = "OVERVIEW" | "LIVE ORDERS" | "MENU ADMIN" | "ANALYTICS";
type DashboardOrderStatus = "PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "COMPLETED" | "DELIVERED" | "CANCELLED";

interface DashboardOrder {
  id: string;
  display_id: string;
  time: string;
  items: Array<{ name: string; quantity: number; modifiers?: Record<string, unknown>; total_price?: number }>;
  items_label: string;
  type: string;
  total_amount: number;
  total: string;
  status: DashboardOrderStatus;
  customer_phone: string;
  delivery_address: string | null;
  created_at: string;
}

interface OverviewResponse {
  metrics: {
    total_calls: number;
    total_orders: number;
    conversion_rate: number;
    revenue: number;
    missed_calls: number;
    active_orders: number;
  };
  hourly: Array<{ hour: string; calls: number; orders: number }>;
  active_calls: Array<{ id: string; language: string; duration_seconds: number; status: string }>;
  recent_orders: DashboardOrder[];
}

interface AnalyticsResponse {
  kpis: {
    most_ordered: string;
    busiest_hour: string;
    avg_order_value: number;
    missed_call_recovery: number;
  };
  languages: Array<{ name: string; value: number }>;
  order_type_split: Array<{ name: string; value: number }>;
  top_items: Array<{ rank: number; item: string; orders: number; revenue_label: string; avg_modifiers: number }>;
  ai_performance: {
    avg_confidence: number;
    handoffs: number;
    orders_with_modifications: number;
  };
}

interface DashboardStore {
  tab: Tab;
  setTab: (tab: Tab) => void;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  tab: "OVERVIEW",
  setTab: (tab) => set({ tab }),
}));

export function OrderDashboard() {
  const { tab, setTab } = useDashboardStore();
  const tabs: Tab[] = ["OVERVIEW", "LIVE ORDERS", "MENU ADMIN", "ANALYTICS"];
  return (
    <div className="border border-border bg-surface p-4 md:p-6">
      <div className="mb-6 flex gap-2 overflow-x-auto">
        {tabs.map((entry) => <button key={entry} onClick={() => setTab(entry)} className={`whitespace-nowrap border px-4 py-3 font-mono text-xs ${tab === entry ? "border-accent bg-accent text-bg" : "border-border text-text-2"}`}>{entry}</button>)}
      </div>
      {tab === "OVERVIEW" && <Overview />}
      {tab === "LIVE ORDERS" && <LiveOrders />}
      {tab === "MENU ADMIN" && <MenuAdmin />}
      {tab === "ANALYTICS" && <Analytics />}
    </div>
  );
}

function Overview() {
  const { data, isLoading, isError, error } = useQuery({ queryKey: ["dashboard-overview"], queryFn: () => api<OverviewResponse>("/dashboard/overview"), retry: 1, refetchInterval: 5000 });
  const metrics = data?.metrics;
  return (
    <div className="grid gap-5">
      {isLoading && <div className="border border-border bg-bg p-5 text-text-2">Loading database dashboard...</div>}
      {isError && <div className="border border-danger bg-danger/10 p-5 text-sm text-danger">{error instanceof Error ? error.message : "Dashboard database request failed"}</div>}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Calls today", String(metrics?.total_calls ?? 0), `${metrics?.missed_calls ?? 0} missed calls`],
          ["Orders today", String(metrics?.total_orders ?? 0), `${metrics?.active_orders ?? 0} active orders`],
          ["Conversion", `${Math.round((metrics?.conversion_rate ?? 0) * 100)}%`, "From call logs + orders"],
          ["Revenue", money(metrics?.revenue ?? 0), "From confirmed orders"],
        ].map(([label, value, delta]) => (
          <div key={label} className="border border-border bg-bg p-5"><p className="text-sm text-text-2">{label}</p><p className="mt-2 font-mono text-3xl">{value}</p><p className="mt-3 text-sm text-accent">{delta}</p></div>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-12">
        <div className="lg:col-span-8"><ChartPanel data={data?.hourly ?? []} /></div>
        <div className="border border-border bg-bg p-5 lg:col-span-4">
          <h3 className="font-bold">Recent active work</h3>
          {(data?.recent_orders ?? []).map((order) => (
            <div key={order.id} className="mt-4 border border-border p-4">
              <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-accent pulse-dot" /><span className="font-mono text-sm">{order.display_id} — {order.type}</span></div>
              <p className="mt-2 text-sm text-text-2">{order.time} — {order.items_label}</p>
              <p className="mt-2 text-xs text-accent">{order.status}</p>
            </div>
          ))}
          {(data?.recent_orders ?? []).length === 0 && <p className="mt-4 text-sm text-text-2">No active database orders right now.</p>}
        </div>
      </div>
    </div>
  );
}

function LiveOrders() {
  const queryClient = useQueryClient();
  const { data: rows = [], isLoading, isError, error } = useQuery({ queryKey: ["dashboard-orders"], queryFn: () => api<DashboardOrder[]>("/dashboard/orders"), retry: 1, refetchInterval: 5000 });
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: DashboardOrderStatus }) =>
      api<DashboardOrder>(`/dashboard/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["dashboard-orders"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard-overview"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard-analytics"] });
    },
  });
  const [expanded, setExpanded] = useState<string | null>(null);
  function nextStatus(status: DashboardOrderStatus): DashboardOrderStatus {
    return status === "CONFIRMED" || status === "PREPARING" ? "READY" : status === "READY" ? "COMPLETED" : status;
  }
  return (
    <div className="overflow-x-auto">
      {isLoading && <div className="border border-border bg-bg p-5 text-text-2">Loading orders from database...</div>}
      {isError && <div className="mb-4 border border-danger bg-danger/10 p-5 text-sm text-danger">{error instanceof Error ? error.message : "Database order request failed"}</div>}
      <table className="w-full min-w-[880px] border-collapse">
        <thead><tr className="font-mono text-xs text-text-3">{["Order #", "Time", "Items", "Type", "Total", "Status", "Action"].map((head) => <th key={head} className="border-b border-border p-3 text-left">{head}</th>)}</tr></thead>
        <tbody>
          {rows.map((order) => (
            <Fragment key={order.id}>
              <tr key={order.id} onClick={() => setExpanded(expanded === order.id ? null : order.id)} className="cursor-pointer hover:bg-bg">
                <td className="border-b border-border p-3 font-mono">{order.display_id}</td><td className="border-b border-border p-3">{order.time}</td><td className="border-b border-border p-3">{order.items_label}</td><td className="border-b border-border p-3">{order.type}</td><td className="border-b border-border p-3">{order.total}</td>
                <td className="border-b border-border p-3"><span className={`rounded-pill px-2 py-1 text-xs ${order.status === "READY" ? "bg-accent text-bg" : ["CONFIRMED", "PREPARING"].includes(order.status) ? "bg-amber-500/15 text-amber-300" : "bg-bg text-text-3"}`}>{order.status}</span></td>
                <td className="border-b border-border p-3">{["CONFIRMED", "PREPARING", "READY"].includes(order.status) ? <button onClick={(event) => { event.stopPropagation(); statusMutation.mutate({ id: order.id, status: nextStatus(order.status) }); }} className="border border-accent px-3 py-2 text-xs text-accent" disabled={statusMutation.isPending}>{order.status === "READY" ? "Complete" : "Mark Ready"}</button> : "—"}</td>
              </tr>
              {expanded === order.id && <tr><td colSpan={7} className="border-b border-border bg-bg p-5 text-sm text-text-2"><p>{order.items.map((item) => `${item.quantity} x ${item.name}`).join(", ")}</p><p className="mt-2">Customer: {order.customer_phone}</p><p className="mt-2">{order.delivery_address ?? "Pickup order"}</p><p className="mt-3">Stored in PostgreSQL order id: {order.id}</p></td></tr>}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Analytics() {
  const { data, isLoading, isError, error } = useQuery({ queryKey: ["dashboard-analytics"], queryFn: () => api<AnalyticsResponse>("/dashboard/analytics"), retry: 1 });
  const kpis = [
    ["Most ordered", data?.kpis.most_ordered ?? "n/a"],
    ["Busiest hour", data?.kpis.busiest_hour ?? "n/a"],
    ["Avg order value", money(data?.kpis.avg_order_value ?? 0)],
    ["Missed call recovery", `${data?.kpis.missed_call_recovery ?? 0}%`],
  ];
  return (
    <div className="grid gap-5">
      {isLoading && <div className="border border-border bg-bg p-5 text-text-2">Loading analytics from database...</div>}
      {isError && <div className="border border-danger bg-danger/10 p-5 text-sm text-danger">{error instanceof Error ? error.message : "Database analytics request failed"}</div>}
      <div className="grid gap-4 md:grid-cols-4">{kpis.map(([label, value]) => <div key={label} className="border border-border bg-bg p-5"><p className="text-sm text-text-2">{label}</p><p className="mt-2 font-bold">{value}</p></div>)}</div>
      <AnalyticsCharts languages={data?.languages ?? []} split={data?.order_type_split ?? []} />
      <div className="border border-border bg-bg p-5">
        <h3 className="font-bold">Top items</h3>
        <table className="mt-4 w-full text-sm"><tbody>{(data?.top_items ?? []).map((row) => <tr key={row.item}><td className="border-b border-border py-3 text-text-2">{row.rank}</td><td className="border-b border-border py-3 text-text-2">{row.item}</td><td className="border-b border-border py-3 text-text-2">{row.orders}</td><td className="border-b border-border py-3 text-text-2">{row.revenue_label}</td><td className="border-b border-border py-3 text-text-2">{row.avg_modifiers}</td></tr>)}</tbody></table>
      </div>
      <div className="grid gap-4 md:grid-cols-3">{[["Average confidence score", `${data?.ai_performance.avg_confidence ?? 0}%`], ["Successful handoffs", String(data?.ai_performance.handoffs ?? 0)], ["Orders with modifications", `${data?.ai_performance.orders_with_modifications ?? 0}%`]].map(([label, value]) => <div key={label} className="border border-border bg-bg p-5"><p className="text-text-2">{label}</p><p className="mt-2 font-mono text-2xl text-accent">{value}</p></div>)}</div>
    </div>
  );
}
