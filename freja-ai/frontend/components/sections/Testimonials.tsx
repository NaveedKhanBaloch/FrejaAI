import { RevealOnScroll } from "../ui/RevealOnScroll";

const testimonials = [
  ["We were missing 20–30 calls every weekend. Freja handles them all. We've added one full pizza shift worth of revenue every Saturday.", "Ahmad K., owner, Pizza Sultanen, Malmö"],
  ["My chef was answering phones during the dinner rush. Now he cooks. Simple as that. The Arabic support alone is worth everything.", "Lars-Erik S., owner, Medelhavs Pizza, Göteborg"],
  ["Foodora was taking 28% of every delivery. We switched to Freja and our own delivery driver. We kept 100% and the customer data.", "Fatima O., owner, Palazzo 54, Stockholm"],
] as const;

export function Testimonials() {
  return (
    <section className="section-shell">
      <RevealOnScroll>
        <p className="section-label">{"// TRUSTED BY"}</p>
        <h2 className="mt-5 max-w-3xl font-display text-5xl leading-tight">Pizza shops across Stockholm and Malmö already switched</h2>
      </RevealOnScroll>
      <div className="mt-12 grid gap-4 lg:grid-cols-3">
        {testimonials.map(([quote, owner]) => (
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
