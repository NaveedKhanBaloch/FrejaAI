import { AnimatedCounter } from "../ui/AnimatedCounter";
import { PhoneMockup } from "../ui/PhoneMockup";
import type { LandingCopy } from "@/lib/landing-copy";

export function Hero({ copy, phoneCopy }: { copy: LandingCopy["hero"]; phoneCopy: LandingCopy["phone"] }) {
  return (
    <section className="section-shell min-h-screen pt-36">
      <div className="grid grid-cols-1 gap-14 lg:grid-cols-12 lg:items-center">
        <div className="stagger lg:col-span-7">
          <p className="section-label mb-6">{copy.label}</p>
          <h1 className="font-display text-[56px] leading-[0.94] tracking-normal md:text-[72px]">
            {copy.title}
          </h1>
          <p className="mt-8 max-w-2xl text-xl leading-8 text-text-2">
            {copy.subtitle}
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <a href="#demo" className="bg-accent px-6 py-4 text-center font-bold text-bg">{copy.primary}</a>
            <a href="/dashboard" className="border border-border px-6 py-4 text-center font-bold text-text-1 transition hover:border-accent">{copy.secondary}</a>
          </div>
        </div>
        <div className="lg:col-span-5">
          <PhoneMockup copy={phoneCopy} />
        </div>
      </div>
      <div className="mt-20 grid gap-4 md:grid-cols-3">
        {copy.stats.map(([value, label], index) => (
          <div key={label} className="border border-border border-l-accent bg-surface p-5 font-mono">
            <div className="text-3xl text-text-1">{index === 2 ? "+" : ""}<AnimatedCounter value={Number(value)} suffix={index === 2 ? "%" : ""} /></div>
            <div className="mt-2 text-sm text-text-2">{label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
