import { painCards } from "@/lib/demo-data";
import { RevealOnScroll } from "../ui/RevealOnScroll";

export function PainPoints() {
  return (
    <section className="section-shell" id="problem">
      <RevealOnScroll>
        <p className="section-label">{"// THE PROBLEM"}</p>
        <h2 className="mt-5 max-w-3xl font-display text-5xl leading-tight">Your phone is costing you money every day</h2>
      </RevealOnScroll>
      <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {painCards.map(([stat, pain, consequence]) => (
          <RevealOnScroll key={stat}>
            <article className="brutal-card h-full p-6 transition duration-150 hover:-translate-y-1 hover:border-accent">
              <div className="font-mono text-4xl text-text-1">{stat}</div>
              <p className="mt-7 text-base leading-7 text-text-2">{pain}</p>
              <p className="mt-7 font-semibold text-accent">{consequence}</p>
            </article>
          </RevealOnScroll>
        ))}
      </div>
    </section>
  );
}
