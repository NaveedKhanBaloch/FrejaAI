import { AnalyticsChart } from "@/components/dashboard/AnalyticsChart";
import { Card } from "@/components/ui/Card";

export default function AnalyticsPage() {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Card><div className="text-sm text-gray-600">Total calls</div><div className="text-3xl font-bold">1,284</div></Card>
        <Card><div className="text-sm text-gray-600">Conversion</div><div className="text-3xl font-bold">68%</div></Card>
        <Card><div className="text-sm text-gray-600">Avg order</div><div className="text-3xl font-bold">kr 186</div></Card>
        <Card><div className="text-sm text-gray-600">Missed</div><div className="text-3xl font-bold">41</div></Card>
      </div>
      <AnalyticsChart />
      <Card>
        <h2 className="font-semibold">Top ordered items</h2>
        <div className="mt-3 grid gap-2 text-sm">
          {["Margherita", "Kebab Pizza", "Falafel Wrap", "Cola"].map((name, index) => <div key={name} className="flex justify-between border-b border-border pb-2"><span>{name}</span><span>{84 - index * 11}</span></div>)}
        </div>
      </Card>
    </div>
  );
}
