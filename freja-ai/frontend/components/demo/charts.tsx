"use client";

import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface Point { hour: string; calls: number; orders: number }
interface Slice { name: string; value: number }

export function ChartPanel({ data }: { data: Point[] }) {
  return (
    <div className="h-80 border border-border bg-bg p-5">
      <h3 className="mb-4 font-bold">Calls vs orders per hour</h3>
      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={data}><CartesianGrid stroke="#232825" /><XAxis dataKey="hour" stroke="#8A8F88" /><YAxis stroke="#8A8F88" /><Tooltip contentStyle={{ background: "#151917", border: "1px solid #232825" }} /><Line dataKey="calls" stroke="#8A8F88" strokeWidth={2} /><Line dataKey="orders" stroke="#C8F060" strokeWidth={2} /></LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AnalyticsCharts({ languages, split }: { languages: Slice[]; split: Slice[] }) {
  const colors = ["#C8F060", "#8FAF30", "#8A8F88", "#4A4F48", "#FF5C3A"];
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="h-80 border border-border bg-bg p-5">
        <h3 className="mb-4 font-bold">Orders by language</h3>
        <ResponsiveContainer width="100%" height="85%"><BarChart data={languages}><CartesianGrid stroke="#232825" /><XAxis dataKey="name" stroke="#8A8F88" /><YAxis stroke="#8A8F88" /><Tooltip contentStyle={{ background: "#151917", border: "1px solid #232825" }} /><Bar dataKey="value">{languages.map((_, index) => <Cell key={index} fill={colors[index]} />)}</Bar></BarChart></ResponsiveContainer>
      </div>
      <div className="h-80 border border-border bg-bg p-5">
        <h3 className="mb-4 font-bold">Order type split</h3>
        <ResponsiveContainer width="100%" height="85%"><PieChart><Pie data={split} dataKey="value" nameKey="name" outerRadius={100} innerRadius={58}>{split.map((_, index) => <Cell key={index} fill={colors[index]} />)}</Pie><Tooltip contentStyle={{ background: "#151917", border: "1px solid #232825" }} /></PieChart></ResponsiveContainer>
      </div>
    </div>
  );
}
