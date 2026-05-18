"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, ChefHat, ClipboardList, Home, LogOut, Phone, Settings, Utensils } from "lucide-react";

const links = [
  { href: "/dashboard", label: "Live", icon: ClipboardList },
  { href: "/dashboard/kitchen", label: "Kitchen", icon: ChefHat },
  { href: "/dashboard/calls", label: "Calls", icon: Phone },
  { href: "/dashboard/menu", label: "Menu", icon: Utensils },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-border bg-surface p-4 lg:flex">
      <div className="mb-8 border-b border-border pb-5">
        <Link href="/" className="font-display text-3xl">FREJA<span className="text-accent">.</span></Link>
        <p className="mt-2 font-mono text-xs uppercase text-text-3">Pizza Palazzo · Stockholm</p>
      </div>

      <nav className="grid gap-1" aria-label="Operations navigation">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 rounded-md px-3 py-3 text-sm font-semibold transition ${
              pathname === href ? "bg-accent text-bg" : "text-text-2 hover:bg-bg hover:text-text-1"
            }`}
          >
            <Icon size={18} /> {label}
          </Link>
        ))}
      </nav>

      <div className="mt-8 rounded-card border border-border bg-bg p-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs uppercase text-text-3">System</span>
          <span className="h-2 w-2 rounded-full bg-accent pulse-dot" />
        </div>
        <p className="mt-3 text-sm text-text-2">Voice agent online</p>
        <p className="mt-1 font-mono text-xs text-text-3">7 languages · 0 missed calls</p>
      </div>

      <div className="mt-auto grid gap-2 border-t border-border pt-4">
        <Link href="/" className="flex items-center gap-3 rounded-md px-3 py-3 text-sm font-semibold text-text-2 hover:bg-bg hover:text-text-1">
          <Home size={18} /> Marketing site
        </Link>
        <button className="flex items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-semibold text-text-3 hover:bg-bg hover:text-danger">
          <LogOut size={18} /> Sign out
        </button>
      </div>
    </aside>
  );
}
