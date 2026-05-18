export function Badge({ children, tone = "accent" }: { children: React.ReactNode; tone?: "accent" | "muted" | "danger" }) {
  const color = tone === "danger" ? "border-danger text-danger" : tone === "muted" ? "border-border text-text-2" : "border-accent text-accent";
  return <span className={`inline-flex rounded-pill border px-3 py-1 font-mono text-xs uppercase ${color}`}>{children}</span>;
}
