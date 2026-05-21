import { VoiceSimulator } from "../demo/VoiceSimulator";
import { RevealOnScroll } from "../ui/RevealOnScroll";

export function VoiceBotDemo() {
  return (
    <section className="section-shell" id="demo">
      <RevealOnScroll>
        <p className="section-label">{"// LIVE DEMO"}</p>
        <h2 className="mt-5 max-w-3xl font-display text-5xl leading-tight">Hear Freja take a real order</h2>
      </RevealOnScroll>
      <div className="mt-12 flex justify-center">
        <RevealOnScroll><VoiceSimulator /></RevealOnScroll>
      </div>
    </section>
  );
}
