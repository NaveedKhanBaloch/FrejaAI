import { OrderDashboard } from "../demo/OrderDashboard";
import { RevealOnScroll } from "../ui/RevealOnScroll";

export function DashboardPreview() {
  return (
    <section className="section-shell" id="dashboard">
      <RevealOnScroll>
        <p className="section-label">{"// THE DASHBOARD"}</p>
        <h2 className="mt-5 max-w-3xl font-display text-5xl leading-tight">Your restaurant. Fully visible. Always.</h2>
      </RevealOnScroll>
      <RevealOnScroll className="mt-12">
        <OrderDashboard />
      </RevealOnScroll>
    </section>
  );
}
