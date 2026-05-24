import { RevealOnScroll } from "../ui/RevealOnScroll";
import { Badge } from "../ui/Badge";
import type { LandingCopy } from "@/lib/landing-copy";

export function Pricing({ copy }: { copy: LandingCopy["pricing"] }) {
  return (
    <section className="section-shell" id="pricing">
      <RevealOnScroll>
        <p className="section-label">{copy.label}</p>
        <h2 className="mt-5 max-w-3xl font-display text-5xl leading-tight">{copy.title}</h2>
        <p className="mt-5 text-xl text-text-2">{copy.subtitle}</p>
      </RevealOnScroll>
      <div className="mt-12 grid gap-4 lg:grid-cols-3">
        {copy.tiers.map(([name, price, sub, benefits, cta]) => (
          <RevealOnScroll key={name}>
            <article className={`relative h-full border bg-surface p-7 ${name === "PRO" ? "border-2 border-accent" : "border-border"}`}>
              {name === "PRO" && <div className="absolute right-5 top-5"><Badge>{copy.popular}</Badge></div>}
              <h3 className="font-mono text-sm text-text-2">{name}</h3>
              <p className="mt-7 font-display text-5xl">{price}</p>
              {name !== "ENTERPRISE" && <p className="mt-1 text-text-2">{copy.month}</p>}
              <p className="mt-5 min-h-12 text-text-2">{sub}</p>
              <ul className="mt-7 space-y-3 text-sm text-text-2">{benefits.map((benefit) => <li key={benefit}>✓ {benefit}</li>)}</ul>
              <a href="#contact" className={`mt-8 block px-5 py-4 text-center font-bold ${name === "PRO" ? "bg-accent text-bg" : "border border-border"}`}>{cta}</a>
            </article>
          </RevealOnScroll>
        ))}
      </div>
      <RevealOnScroll className="mt-8 flex flex-wrap gap-3">
        {copy.signals.map((signal) => <Badge key={signal} tone="muted">{signal}</Badge>)}
      </RevealOnScroll>
    </section>
  );
}
