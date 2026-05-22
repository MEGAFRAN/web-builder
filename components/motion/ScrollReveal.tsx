"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";

export function ScrollReveal({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [revealed, setRevealed] = useState(false);
  const visible = prefersReducedMotion || revealed;

  useEffect(() => {
    if (prefersReducedMotion) return;

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -5% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [prefersReducedMotion]);

  return (
    <div
      ref={ref}
      data-scroll-reveal
      data-visible={visible ? "true" : "false"}
    >
      {children}
    </div>
  );
}
