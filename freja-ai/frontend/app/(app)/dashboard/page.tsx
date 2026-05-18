import { OrderDashboard } from "@/components/demo/OrderDashboard";

export default function DashboardPage() {
  return (
    <main className="mx-auto min-h-screen max-w-content px-6 py-24">
      <div className="mb-6">
        <p className="section-label">{"// RESTAURANT DASHBOARD"}</p>
        <h2 className="mt-3 font-display text-5xl leading-tight">Your restaurant. Fully visible. Always.</h2>
        <p className="mt-4 max-w-2xl text-text-2">
          This is the same live dashboard Freja gives restaurant owners after phone orders are confirmed.
        </p>
      </div>
      <OrderDashboard />
    </main>
  );
}
