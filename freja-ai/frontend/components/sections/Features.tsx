import { RevealOnScroll } from "../ui/RevealOnScroll";

const features = [
  ["◎", "Multilingual by default", "Swedish. Arabic. Somali. Turkish. Urdu. Kurdish. English. Freja auto-detects the language and responds natively. No configuration needed."],
  ["≡", "Unlimited customisation", "Half-and-half pizzas. Extra cheese on one half. No onion. Gluten-free crust. Freja handles modifier trees that no delivery platform supports."],
  ["✓", "Zero missed calls", "Freja handles concurrent calls simultaneously. Rush hour on a Friday night? Every caller gets answered. Every order gets taken."],
  ["▦", "Kitchen display", "Orders appear on the kitchen screen the moment they're confirmed — structured, clean, prioritised by time. No paper, no shouting."],
  ["↗", "Human handoff", "If a customer is frustrated or the request is complex, Freja transfers the call to your staff instantly — with a full transcript so nothing is repeated."],
  ["⌁", "Call recordings + transcripts", "Every call recorded and transcribed. Review disputes, train staff, and audit orders at any time from your dashboard."],
  ["↟", "Analytics dashboard", "See your busiest hours, most ordered items, missed call recovery rate, and AI confidence scores. Make better decisions with real data."],
  ["▣", "Peace of mind", "Freja never has a bad day. Never forgets an order. Never puts a customer on hold for 8 minutes. She's there before your first chef arrives."],
] as const;

export function Features() {
  return (
    <section className="section-shell" id="features">
      <RevealOnScroll>
        <p className="section-label">{"// FEATURES"}</p>
        <h2 className="mt-5 max-w-3xl font-display text-5xl leading-tight">Built for the chaos of a real pizza kitchen</h2>
      </RevealOnScroll>
      <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {features.map(([icon, title, body]) => (
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
