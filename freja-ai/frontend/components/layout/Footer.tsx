import type { LandingCopy } from "@/lib/landing-copy";

export function Footer({ copy }: { copy: LandingCopy["footer"] }) {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto grid max-w-content gap-8 px-6 py-12 md:grid-cols-3">
        <div><div className="font-display text-3xl">FREJA<span className="text-accent">.</span></div><p className="mt-3 text-sm text-text-2">{copy.tagline}</p></div>
        <nav className="grid gap-2 text-sm text-text-2">
          {copy.links.map((link, index) => <a key={link} href={index === 0 ? "#features" : index === 1 ? "#demo" : index === 2 ? "#pricing" : "#contact"}>{link}</a>)}
        </nav>
        <div className="text-sm text-text-2 md:text-right"><p>{copy.made}</p><p className="mt-3">{copy.rights}</p></div>
      </div>
      <div className="border-t border-border px-6 py-4 text-center font-mono text-xs text-text-3">
        {copy.note}
      </div>
    </footer>
  );
}
