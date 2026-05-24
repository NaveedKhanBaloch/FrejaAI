import { VoiceSimulator } from "../demo/VoiceSimulator";
import { RevealOnScroll } from "../ui/RevealOnScroll";
import type { LandingCopy } from "@/lib/landing-copy";

export function VoiceBotDemo({ copy }: { copy: LandingCopy["demo"] }) {
  return (
    <section className="section-shell" id="demo">
      <RevealOnScroll>
        <p className="section-label">{copy.label}</p>
        <h2 className="mt-5 max-w-3xl font-display text-5xl leading-tight">{copy.title}</h2>
      </RevealOnScroll>
      <div className="mt-12 flex justify-center">
        <RevealOnScroll><VoiceSimulator copy={copy} /></RevealOnScroll>
      </div>
    </section>
  );
}
