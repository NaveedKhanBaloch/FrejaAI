export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto grid max-w-content gap-8 px-6 py-12 md:grid-cols-3">
        <div><div className="font-display text-3xl">FREJA<span className="text-accent">.</span></div><p className="mt-3 text-sm text-text-2">AI Voice Ordering for Nordic Restaurants</p></div>
        <nav className="grid gap-2 text-sm text-text-2">
          {["Features", "Demo", "Pricing", "Privacy Policy", "GDPR", "Contact"].map((link) => <a key={link} href={link === "Features" ? "#features" : link === "Demo" ? "#demo" : link === "Pricing" ? "#pricing" : "#contact"}>{link}</a>)}
        </nav>
        <div className="text-sm text-text-2 md:text-right"><p>Made in Stockholm 🇸🇪</p><p className="mt-3">© 2025 Freja AI AB. All rights reserved.</p></div>
      </div>
      <div className="border-t border-border px-6 py-4 text-center font-mono text-xs text-text-3">
        Freja AI is GDPR-compliant. All call recordings are encrypted. Customer data is never shared with third parties.
      </div>
    </footer>
  );
}
