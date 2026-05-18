import { RevealOnScroll } from "../ui/RevealOnScroll";
import { Badge } from "../ui/Badge";

const tiers = [
  ["STARTER", "kr 890", "For single-location pizza shops", ["1 phone line", "Up to 500 calls/month", "Swedish + English", "Dashboard access", "Email support"], "Get started →"],
  ["PRO", "kr 1,490", "For busy restaurants and chains", ["3 phone lines (concurrent calls)", "Unlimited calls", "All 7 languages", "Full dashboard + analytics", "Menu admin panel", "Call recordings + transcripts", "Priority support"], "Get started →"],
  ["ENTERPRISE", "Custom pricing", "For restaurant groups + franchises", ["Unlimited lines", "Multi-location dashboard", "White-label voice (your brand voice)", "POS integration", "Dedicated onboarding", "SLA guarantee"], "Contact sales →"],
] as const;

export function Pricing() {
  return (
    <section className="section-shell" id="pricing">
      <RevealOnScroll>
        <p className="section-label">{"// PRICING"}</p>
        <h2 className="mt-5 max-w-3xl font-display text-5xl leading-tight">One flat fee. No commission. No surprises.</h2>
        <p className="mt-5 text-xl text-text-2">Compare that to what Foodora charged you last month.</p>
      </RevealOnScroll>
      <div className="mt-12 grid gap-4 lg:grid-cols-3">
        {tiers.map(([name, price, sub, benefits, cta]) => (
          <RevealOnScroll key={name}>
            <article className={`relative h-full border bg-surface p-7 ${name === "PRO" ? "border-2 border-accent" : "border-border"}`}>
              {name === "PRO" && <div className="absolute right-5 top-5"><Badge>MOST POPULAR</Badge></div>}
              <h3 className="font-mono text-sm text-text-2">{name}</h3>
              <p className="mt-7 font-display text-5xl">{price}</p>
              {name !== "ENTERPRISE" && <p className="mt-1 text-text-2">/ month</p>}
              <p className="mt-5 min-h-12 text-text-2">{sub}</p>
              <ul className="mt-7 space-y-3 text-sm text-text-2">{benefits.map((benefit) => <li key={benefit}>✓ {benefit}</li>)}</ul>
              <a href="#contact" className={`mt-8 block px-5 py-4 text-center font-bold ${name === "PRO" ? "bg-accent text-bg" : "border border-border"}`}>{cta}</a>
            </article>
          </RevealOnScroll>
        ))}
      </div>
      <RevealOnScroll className="mt-8 flex flex-wrap gap-3">
        {["✓ No setup fee", "✓ Cancel anytime", "✓ GDPR compliant", "✓ 14-day free trial", "✓ No Foodora. No commission."].map((signal) => <Badge key={signal} tone="muted">{signal}</Badge>)}
      </RevealOnScroll>
    </section>
  );
}
