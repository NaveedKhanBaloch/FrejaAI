import { RevealOnScroll } from "../ui/RevealOnScroll";
import type { LandingCopy } from "@/lib/landing-copy";

export function Testimonials({ copy }: { copy: LandingCopy["testimonials"] }) {
  return (
    <section className="section-shell">
      <RevealOnScroll>
        <p className="section-label">{copy.label}</p>
        <h2 className="mt-5 max-w-3xl font-display text-5xl leading-tight">{copy.title}</h2>
      </RevealOnScroll>
      <div className="mt-12 grid gap-4 lg:grid-cols-3">
        {copy.items.map(([quote, owner]) => (
          <RevealOnScroll key={owner}>
            <article className="brutal-card h-full p-7">
              <p className="font-display text-3xl italic leading-tight">&quot;{quote}&quot;</p>
              <p className="mt-8 text-sm font-semibold text-text-2">— {owner}</p>
              <p className="mt-4 font-mono text-accent">★★★★★</p>
            </article>
          </RevealOnScroll>
        ))}
      </div>
    </section>
  );
}
