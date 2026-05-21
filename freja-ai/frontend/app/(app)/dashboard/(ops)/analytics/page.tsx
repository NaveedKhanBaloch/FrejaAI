"use client";

import { useQuery } from "@tanstack/react-query";
import { AnalyticsChart } from "@/components/dashboard/AnalyticsChart";
import { Card } from "@/components/ui/Card";
import { api } from "@/lib/api";
import { money } from "@/lib/utils";

interface DashboardAnalytics {
  kpis: {
    most_ordered: string;
    busiest_hour: string;
    avg_order_value: number;
    missed_call_recovery: number;
  };
  languages: Array<{ name: string; value: number }>;
  top_items: Array<{ rank: number; item: string; orders: number; revenue_label: string; avg_modifiers: number }>;
  ai_performance: {
    avg_confidence: number;
    handoffs: number;
    orders_with_modifications: number;
  };
}

interface DashboardOverview {
  metrics: {
    total_calls: number;
    total_orders: number;
    conversion_rate: number;
    revenue: number;
    missed_calls: number;
  };
  hourly: Array<{ hour: string; calls: number; orders: number }>;
}

export default function AnalyticsPage() {
  const analytics = useQuery({ queryKey: ["dashboard-analytics"], queryFn: () => api<DashboardAnalytics>("/dashboard/analytics") });
  const overview = useQuery({ queryKey: ["dashboard-overview"], queryFn: () => api<DashboardOverview>("/dashboard/overview") });
  const metrics = overview.data?.metrics;

  return (
    <div className="grid gap-4">
      {(analytics.isError || overview.isError) && (
        <Card className="border-red-200 bg-red-50 text-sm text-red-900">
          Dashboard analytics are unavailable. Start the backend and Postgres, then reload this page.
        </Card>
      )}
      <div className="grid gap-4 md:grid-cols-4">
        <Card><div className="text-sm text-gray-600">Total calls</div><div className="text-3xl font-bold">{metrics?.total_calls ?? 0}</div></Card>
        <Card><div className="text-sm text-gray-600">Conversion</div><div className="text-3xl font-bold">{Math.round((metrics?.conversion_rate ?? 0) * 100)}%</div></Card>
        <Card><div className="text-sm text-gray-600">Avg order</div><div className="text-3xl font-bold">{money(analytics.data?.kpis.avg_order_value ?? 0)}</div></Card>
        <Card><div className="text-sm text-gray-600">Missed</div><div className="text-3xl font-bold">{metrics?.missed_calls ?? 0}</div></Card>
      </div>
      <AnalyticsChart calls={overview.data?.hourly ?? []} languages={analytics.data?.languages ?? []} />
      <Card>
        <h2 className="font-semibold">Top ordered items</h2>
        <div className="mt-3 grid gap-2 text-sm">
          {(analytics.data?.top_items ?? []).map((item) => (
            <div key={item.item} className="grid grid-cols-4 gap-3 border-b border-border pb-2">
              <span>{item.rank}. {item.item}</span>
              <span>{item.orders} orders</span>
              <span>{item.revenue_label}</span>
              <span>{item.avg_modifiers} avg modifiers</span>
            </div>
          ))}
          {(analytics.data?.top_items ?? []).length === 0 && <span className="text-gray-500">No orders in the database yet.</span>}
        </div>
      </Card>
    </div>
  );
}
