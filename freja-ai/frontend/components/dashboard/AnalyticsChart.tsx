"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/Card";

interface HourlyPoint {
  hour: string;
  calls: number;
  orders: number;
}

interface LanguagePoint {
  name: string;
  value: number;
}

export function AnalyticsChart({ calls, languages }: { calls: HourlyPoint[]; languages: LanguagePoint[] }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card className="h-80">
        <h2 className="mb-4 font-semibold">Calls per hour</h2>
        <ResponsiveContainer width="100%" height="85%">
          <LineChart data={calls}>
            <CartesianGrid stroke="#e5e7eb" />
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="calls" stroke="#0d7f72" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
      <Card className="h-80">
        <h2 className="mb-4 font-semibold">Orders by language</h2>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={languages}>
            <CartesianGrid stroke="#e5e7eb" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#d97706" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
