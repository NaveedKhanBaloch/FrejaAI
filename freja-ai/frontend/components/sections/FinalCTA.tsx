import { RevealOnScroll } from "../ui/RevealOnScroll";
import type { LandingCopy } from "@/lib/landing-copy";

export function FinalCTA({ copy }: { copy: LandingCopy["cta"] }) {
  return (
    <section className="section-shell relative overflow-hidden" id="contact">
      <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_0_160px_rgba(200,240,96,0.22)]" aria-hidden />
      <RevealOnScroll className="relative mx-auto max-w-3xl border border-border bg-surface p-8 md:p-12">
        <h2 className="font-display text-5xl italic leading-tight md:text-6xl">{copy.title}</h2>
        <p className="mt-6 text-xl leading-8 text-text-2">{copy.subtitle}</p>
        <form className="mt-8 grid gap-3">
          <input className="border border-border bg-bg p-4" placeholder={copy.restaurant} aria-label={copy.restaurant} />
          <input className="border border-border bg-bg p-4" placeholder={copy.phone} type="tel" aria-label={copy.phone} />
          <input className="border border-border bg-bg p-4" placeholder={copy.city} aria-label={copy.city} />
          <button className="bg-accent p-4 font-bold text-bg">{copy.button}</button>
        </form>
        <p className="mt-5 text-center text-sm text-text-2">{copy.direct}</p>
      </RevealOnScroll>
    </section>
  );
}
