export function PhoneMockup() {
  const words = "Jag vill ha en stor Margherita med extra ost".split(" ");
  return (
    <div className="mx-auto w-full max-w-[390px] border border-border bg-surface p-4 shadow-2xl">
      <div className="flex items-center justify-between border-b border-border pb-3 font-mono text-xs text-text-2">
        <span>FREJA CALL</span>
        <span className="text-accent">LIVE</span>
      </div>
      <div className="py-8">
        <div className="mx-auto mb-8 flex h-20 items-end justify-center gap-2" aria-hidden>
          {Array.from({ length: 22 }, (_, index) => (
            <span key={index} className="wave-bar block w-2 bg-accent" style={{ height: `${18 + ((index * 17) % 54)}px`, animationDelay: `${index * 38}ms` }} />
          ))}
        </div>
        <div className="rounded-card border border-border bg-bg p-4">
          <p className="mb-3 font-mono text-xs uppercase text-text-3">Live transcript</p>
          <p className="min-h-20 text-lg leading-relaxed">
            {words.map((word, index) => (
              <span key={word + index} className="inline-block animate-[fade-up_600ms_ease_both] pr-1" style={{ animationDelay: `${index * 120}ms` }}>{word}</span>
            ))}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 font-mono text-xs text-text-2">
        <span className="border border-border p-2">Language: SV</span>
        <span className="border border-border p-2">Order: parsed</span>
      </div>
    </div>
  );
}
