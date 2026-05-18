import { RevealOnScroll } from "../ui/RevealOnScroll";

const steps = [
  ["Customer calls", "Vonage receives the call instantly"],
  ["Freja answers", "Greets in the customer's language within 1s"],
  ["Order is taken", "Customisations, modifiers, allergies — all captured"],
  ["Order confirmed", "Freja reads back the order, confirms total"],
  ["Kitchen notified", "Ticket appears on kitchen display in real time"],
  ["You cook", "No interruptions. No mistakes. No missed calls."],
] as const;

export function HowItWorks() {
  return (
    <section className="section-shell">
      <RevealOnScroll>
        <p className="section-label">{"// HOW IT WORKS"}</p>
        <h2 className="mt-5 max-w-3xl font-display text-5xl leading-tight">A phone call. Handled perfectly. Every time.</h2>
      </RevealOnScroll>
      <div className="relative mt-16 grid gap-8 lg:grid-cols-6">
        <div className="absolute left-8 right-8 top-7 hidden border-t border-dashed border-text-3 lg:block" />
        {steps.map(([title, description], index) => (
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
        &quot;If Freja can&apos;t handle it — she transfers to your staff instantly. You&apos;re always in control.&quot;
      </RevealOnScroll>
    </section>
  );
}
