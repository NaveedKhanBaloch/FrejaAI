import { AnimatedCounter } from "../ui/AnimatedCounter";
import { PhoneMockup } from "../ui/PhoneMockup";

export function Hero() {
  return (
    <section className="section-shell min-h-screen pt-36">
      <div className="grid grid-cols-1 gap-14 lg:grid-cols-12 lg:items-center">
        <div className="stagger lg:col-span-7">
          <p className="section-label mb-6">{"// AI VOICE ORDERING"}</p>
          <h1 className="font-display text-[56px] leading-[0.94] tracking-normal md:text-[72px]">
            Last Friday you missed 14 calls. That&apos;s 14 pizzas you never made.
          </h1>
          <p className="mt-8 max-w-2xl text-xl leading-8 text-text-2">
            Freja answers every call. Takes the order. Speaks their language. You just cook.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <a href="#demo" className="bg-accent px-6 py-4 text-center font-bold text-bg">Try the voice demo</a>
            <a href="/dashboard" className="border border-border px-6 py-4 text-center font-bold text-text-1 transition hover:border-accent">See the dashboard →</a>
          </div>
        </div>
        <div className="lg:col-span-5">
          <PhoneMockup />
        </div>
      </div>
      <div className="mt-20 grid gap-4 md:grid-cols-3">
        {[
          ["0", "Missed calls"],
          ["3", "Languages spoken"],
          ["31", "Avg order value"],
        ].map(([value, label], index) => (
          <div key={label} className="border border-border border-l-accent bg-surface p-5 font-mono">
            <div className="text-3xl text-text-1">{index === 2 ? "+" : ""}<AnimatedCounter value={Number(value)} suffix={index === 2 ? "%" : ""} /></div>
            <div className="mt-2 text-sm text-text-2">{label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
