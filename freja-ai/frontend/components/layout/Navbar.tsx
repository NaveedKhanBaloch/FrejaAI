"use client";

import { useEffect, useState } from "react";

const links = [
  ["Features", "#features"],
  ["Demo", "#demo"],
  ["Dashboard", "/dashboard"],
  ["Pricing", "#pricing"],
  ["Contact", "#contact"],
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`fixed inset-x-0 top-0 z-50 border-b border-border transition ${scrolled ? "bg-bg/82 backdrop-blur-xl" : "bg-bg/40"}`}>
      <div className="mx-auto flex h-18 max-w-content items-center justify-between px-6 py-4">
        <a href="#" className="font-display text-3xl tracking-normal">FREJA<span className="text-accent">.</span></a>
        <nav className="hidden items-center gap-8 text-sm font-semibold uppercase text-text-2 md:flex">
          {links.map(([label, href]) => <a key={href} href={href} className="transition hover:text-text-1">{label}</a>)}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <div className="border border-border font-mono text-xs"><button className="bg-accent px-3 py-2 text-bg">SV</button><button className="px-3 py-2 text-text-2">EN</button></div>
          <a href="#contact" className="bg-accent px-5 py-3 text-sm font-bold text-bg transition hover:bg-text-1">Book a Demo →</a>
        </div>
        <button className="border border-border px-3 py-2 text-sm md:hidden" onClick={() => setOpen(true)} aria-label="Open menu">MENU</button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 bg-bg p-6 md:hidden">
          <div className="flex items-center justify-between">
            <span className="font-display text-3xl">FREJA<span className="text-accent">.</span></span>
            <button className="border border-border px-3 py-2" onClick={() => setOpen(false)}>CLOSE</button>
          </div>
          <div className="mt-16 grid gap-8 text-4xl font-bold">
            {links.map(([label, href]) => <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>)}
            <a href="#contact" onClick={() => setOpen(false)} className="bg-accent p-5 text-bg">Book a Demo →</a>
          </div>
        </div>
      )}
    </header>
  );
}
