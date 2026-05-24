"use client";

import { useEffect, useState } from "react";
import type { LandingCopy, LandingLanguage } from "@/lib/landing-copy";

interface NavbarProps {
  copy: LandingCopy["nav"];
  language: LandingLanguage;
  onLanguageChange: (language: LandingLanguage) => void;
}

export function Navbar({ copy, language, onLanguageChange }: NavbarProps) {
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
          {copy.links.map(([label, href]) => <a key={href} href={href} className="transition hover:text-text-1">{label}</a>)}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <div className="border border-border font-mono text-xs">
            <button onClick={() => onLanguageChange("sv")} className={`px-3 py-2 ${language === "sv" ? "bg-accent text-bg" : "text-text-2"}`}>SV</button>
            <button onClick={() => onLanguageChange("en")} className={`px-3 py-2 ${language === "en" ? "bg-accent text-bg" : "text-text-2"}`}>EN</button>
          </div>
        </div>
        <button className="border border-border px-3 py-2 text-sm md:hidden" onClick={() => setOpen(true)} aria-label="Open menu">{copy.menu}</button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 bg-bg p-6 md:hidden">
          <div className="flex items-center justify-between">
            <span className="font-display text-3xl">FREJA<span className="text-accent">.</span></span>
            <button className="border border-border px-3 py-2" onClick={() => setOpen(false)}>{copy.close}</button>
          </div>
          <div className="mt-16 grid gap-8 text-4xl font-bold">
            {copy.links.map(([label, href]) => <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>)}
            <div className="flex border border-border font-mono text-base">
              <button onClick={() => onLanguageChange("sv")} className={`flex-1 px-4 py-3 ${language === "sv" ? "bg-accent text-bg" : "text-text-2"}`}>SV</button>
              <button onClick={() => onLanguageChange("en")} className={`flex-1 px-4 py-3 ${language === "en" ? "bg-accent text-bg" : "text-text-2"}`}>EN</button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
