"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { create } from "zustand";
import { hourlyData, languageData, orderTypeData, orders, topItems, DemoOrder, OrderStatus } from "@/lib/demo-data";
import { MenuAdmin } from "./MenuAdmin";

const ChartPanel = dynamic(() => import("./charts").then((module) => module.ChartPanel), { ssr: false });
const AnalyticsCharts = dynamic(() => import("./charts").then((module) => module.AnalyticsCharts), { ssr: false });

type Tab = "OVERVIEW" | "LIVE ORDERS" | "MENU ADMIN" | "ANALYTICS";

interface DashboardStore {
  tab: Tab;
  orders: DemoOrder[];
  setTab: (tab: Tab) => void;
  setStatus: (id: string, status: OrderStatus) => void;
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  tab: "OVERVIEW",
  orders,
  setTab: (tab) => set({ tab }),
  setStatus: (id, status) => set((state) => ({ orders: state.orders.map((order) => (order.id === id ? { ...order, status } : order)) })),
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
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setPulse((value) => value + 1), 8000);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <div className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-4">
        {[["Calls today", "47", "↑ +12 vs yesterday"], ["Orders today", "31", "↑ +8 vs yesterday"], ["Conversion", "66%", "↑ +9% vs last week"], ["Revenue", "kr 4,820", "↑ +kr 840 yesterday"]].map(([label, value, delta]) => (
          <div key={label} className="border border-border bg-bg p-5"><p className="text-sm text-text-2">{label}</p><p className="mt-2 font-mono text-3xl">{value}</p><p className="mt-3 text-sm text-accent">{delta}</p></div>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-12">
        <div className="lg:col-span-8"><ChartPanel data={hourlyData} /></div>
        <div className="border border-border bg-bg p-5 lg:col-span-4">
          <h3 className="font-bold">Live active calls</h3>
          {[["Call #1", "Swedish", "1m 42s", "Taking order..."], ["Call #2", pulse % 2 ? "Somali" : "Arabic", "0m 18s", "Greeting..."]].map((call) => (
            <div key={call[0]} className="mt-4 border border-border p-4">
              <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-accent pulse-dot" /><span className="font-mono text-sm">{call[0]} — {call[1]}</span></div>
              <p className="mt-2 text-sm text-text-2">{call[2]} — {call[3]}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LiveOrders() {
  const { orders: rows, setStatus } = useDashboardStore();
  const [expanded, setExpanded] = useState<string | null>(null);
  function nextStatus(status: OrderStatus): OrderStatus {
    return status === "PREPARING" ? "READY" : status === "READY" ? "COMPLETED" : status;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[880px] border-collapse">
        <thead><tr className="font-mono text-xs text-text-3">{["Order #", "Time", "Items", "Type", "Total", "Status", "Action"].map((head) => <th key={head} className="border-b border-border p-3 text-left">{head}</th>)}</tr></thead>
        <tbody>
          {rows.map((order) => (
            <>
              <tr key={order.id} onClick={() => setExpanded(expanded === order.id ? null : order.id)} className="cursor-pointer hover:bg-bg">
                <td className="border-b border-border p-3 font-mono">{order.id}</td><td className="border-b border-border p-3">{order.time}</td><td className="border-b border-border p-3">{order.items}</td><td className="border-b border-border p-3">{order.type}</td><td className="border-b border-border p-3">{order.total}</td>
                <td className="border-b border-border p-3"><span className={`rounded-pill px-2 py-1 text-xs ${order.status === "READY" ? "bg-accent text-bg" : order.status === "PREPARING" ? "bg-amber-500/15 text-amber-300" : "bg-bg text-text-3"}`}>{order.status}</span></td>
                <td className="border-b border-border p-3">{order.status === "PREPARING" || order.status === "READY" ? <button onClick={(event) => { event.stopPropagation(); setStatus(order.id, nextStatus(order.status)); }} className="border border-accent px-3 py-2 text-xs text-accent">{order.status === "PREPARING" ? "Mark Ready" : "Complete"}</button> : "—"}</td>
              </tr>
              {expanded === order.id && <tr><td colSpan={7} className="border-b border-border bg-bg p-5 text-sm text-text-2"><p>{order.detail}</p><p className="mt-2">Customer: +46 *** *** 412</p><p className="mt-2">{order.address}</p><button onClick={() => new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=").play()} className="mt-3 border border-border px-3 py-2">▶ Play</button><p className="mt-3">{order.transcript}</p></td></tr>}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Analytics() {
  const kpis = [["Most ordered", "Kebabpizza (38 this week)"], ["Busiest hour", "19:00–20:00"], ["Avg order value", "kr 187"], ["Missed call recovery", "94%"]];
  return (
    <div className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-4">{kpis.map(([label, value]) => <div key={label} className="border border-border bg-bg p-5"><p className="text-sm text-text-2">{label}</p><p className="mt-2 font-bold">{value}</p></div>)}</div>
      <AnalyticsCharts languages={languageData} split={orderTypeData} />
      <div className="border border-border bg-bg p-5">
        <h3 className="font-bold">Top items</h3>
        <table className="mt-4 w-full text-sm"><tbody>{topItems.map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell} className="border-b border-border py-3 text-text-2">{cell}</td>)}</tr>)}</tbody></table>
      </div>
      <div className="grid gap-4 md:grid-cols-3">{[["Average confidence score", "94.2%"], ["Successful handoffs", "3 (this week)"], ["Orders with modifications", "67%"]].map(([label, value]) => <div key={label} className="border border-border bg-bg p-5"><p className="text-text-2">{label}</p><p className="mt-2 font-mono text-2xl text-accent">{value}</p></div>)}</div>
    </div>
  );
}
