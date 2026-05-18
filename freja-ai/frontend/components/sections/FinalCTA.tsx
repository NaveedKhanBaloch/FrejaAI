import { RevealOnScroll } from "../ui/RevealOnScroll";

export function FinalCTA() {
  return (
    <section className="section-shell relative overflow-hidden" id="contact">
      <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_0_160px_rgba(200,240,96,0.22)]" aria-hidden />
      <RevealOnScroll className="relative mx-auto max-w-3xl border border-border bg-surface p-8 md:p-12">
        <h2 className="font-display text-5xl italic leading-tight md:text-6xl">&quot;Stop losing customers to a ringing phone.&quot;</h2>
        <p className="mt-6 text-xl leading-8 text-text-2">Book a 20-minute demo. We&apos;ll show you Freja live on your own menu, in your language, on your number.</p>
        <form className="mt-8 grid gap-3">
          <input className="border border-border bg-bg p-4" placeholder="Restaurant name" aria-label="Restaurant name" />
          <input className="border border-border bg-bg p-4" placeholder="Your phone number" type="tel" aria-label="Your phone number" />
          <input className="border border-border bg-bg p-4" placeholder="City" aria-label="City" />
          <button className="bg-accent p-4 font-bold text-bg">Book free demo →</button>
        </form>
        <p className="mt-5 text-center text-sm text-text-2">or call us directly: +46 10 123 45 67</p>
      </RevealOnScroll>
    </section>
  );
}
