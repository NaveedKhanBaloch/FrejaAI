import Link from "next/link";

export function Header({ title }: { title: string }) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-6">
      <Link href="/dashboard" className="font-display text-2xl lg:hidden">FREJA<span className="text-accent">.</span></Link>
      <h1 className="text-xl font-semibold">{title}</h1>
      <div className="rounded-md border border-border px-3 py-1 text-sm text-text-2">Nordic Ops</div>
    </header>
  );
}
