import { RevealOnScroll } from "../ui/RevealOnScroll";
import type { LandingCopy } from "@/lib/landing-copy";

export function PlatformComparison({ copy }: { copy: LandingCopy["comparison"] }) {
  return (
    <section className="section-shell">
      <RevealOnScroll>
        <p className="section-label">{copy.label}</p>
        <h2 className="mt-5 max-w-3xl font-display text-5xl leading-tight">{copy.title}</h2>
      </RevealOnScroll>
      <RevealOnScroll className="mt-12 overflow-x-auto border border-border bg-surface">
        <table className="w-full min-w-[820px] border-collapse text-left">
          <thead>
            <tr className="font-mono text-sm uppercase text-text-2">
              {copy.headings.map((heading) => (
                <th key={heading} className={`border-b border-border p-4 ${heading === "FREJA AI" ? "border-t-2 border-t-accent bg-accent/10 text-accent" : ""}`}>{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {copy.rows.map((row, index) => (
              <tr key={row[0]} className={index % 2 ? "bg-bg/35" : ""}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className={`border-b border-border p-4 ${cellIndex === 4 ? "bg-accent/5" : ""} ${cell === "✓" ? "text-safe" : cell === "✗" ? "text-danger" : "text-text-2"}`}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </RevealOnScroll>
      <RevealOnScroll className="mt-8 border border-border bg-bg p-6 font-display text-3xl italic">
        {copy.callout}
      </RevealOnScroll>
    </section>
  );
}
