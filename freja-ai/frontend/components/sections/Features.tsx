import { RevealOnScroll } from "../ui/RevealOnScroll";
import type { LandingCopy } from "@/lib/landing-copy";

export function Features({ copy }: { copy: LandingCopy["features"] }) {
  return (
    <section className="section-shell" id="features">
      <RevealOnScroll>
        <p className="section-label">{copy.label}</p>
        <h2 className="mt-5 max-w-3xl font-display text-5xl leading-tight">{copy.title}</h2>
      </RevealOnScroll>
      <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {copy.items.map(([icon, title, body]) => (
          <RevealOnScroll key={title}>
            <article className="brutal-card h-full p-6 transition duration-150 hover:border-accent">
              <div className="mb-7 font-mono text-3xl text-accent" aria-hidden>{icon}</div>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="mt-4 text-[15px] leading-7 text-text-2">{body}</p>
            </article>
          </RevealOnScroll>
        ))}
      </div>
    </section>
  );
}
