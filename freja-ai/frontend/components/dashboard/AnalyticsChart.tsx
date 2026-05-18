"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/Card";

const calls = Array.from({ length: 12 }, (_, index) => ({ hour: `${index + 8}:00`, calls: Math.round(5 + Math.random() * 14) }));
const languages = [
  { language: "sv", orders: 42 },
  { language: "en", orders: 31 },
  { language: "ar", orders: 12 },
  { language: "tr", orders: 8 },
];

export function AnalyticsChart() {
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
            <XAxis dataKey="language" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="orders" fill="#d97706" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
