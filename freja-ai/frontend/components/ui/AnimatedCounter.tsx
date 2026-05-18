"use client";

import { useEffect, useRef, useState } from "react";

export function AnimatedCounter({ value, suffix = "", prefix = "" }: { value: number; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      let frame = 0;
      const total = 48;
      const tick = () => {
        frame += 1;
        setCurrent(Math.round((value * frame) / total));
        if (frame < total) requestAnimationFrame(tick);
      };
      tick();
      observer.disconnect();
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [value]);

  return <span ref={ref}>{prefix}{current}{suffix}</span>;
}
