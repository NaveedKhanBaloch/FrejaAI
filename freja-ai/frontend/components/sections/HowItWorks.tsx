import { RevealOnScroll } from "../ui/RevealOnScroll";
import type { LandingCopy } from "@/lib/landing-copy";

export function HowItWorks({ copy }: { copy: LandingCopy["how"] }) {
  return (
    <section className="section-shell">
      <RevealOnScroll>
        <p className="section-label">{copy.label}</p>
        <h2 className="mt-5 max-w-3xl font-display text-5xl leading-tight">{copy.title}</h2>
      </RevealOnScroll>
      <div className="relative mt-16 grid gap-8 lg:grid-cols-6">
        <div className="absolute left-8 right-8 top-7 hidden border-t border-dashed border-text-3 lg:block" />
        {copy.steps.map(([title, description], index) => (
          <RevealOnScroll key={title}>
            <div className="relative">
              <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-accent font-mono text-bg">{index + 1}</div>
              <h3 className="mt-5 text-xl font-bold">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-text-2">{description}</p>
            </div>
          </RevealOnScroll>
        ))}
      </div>
      <RevealOnScroll className="mt-14 border border-accent bg-accent/10 p-6 text-xl leading-8">
        {copy.callout}
      </RevealOnScroll>
    </section>
  );
}
