"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import { formatStatValue, parseStatValue, type ParsedStatValue } from "@/lib/parse-stat-value";

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function AnimatedStatValueInner({
  parsed,
  value,
  className,
}: {
  parsed: ParsedStatValue;
  value: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(parsed.display);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const runAnimation = () => {
      if (hasAnimated.current) return;
      hasAnimated.current = true;

      const start = performance.now();
      const duration = 1500;
      const target = parsed.numericValue;

      const tick = (now: number) => {
        const progress = Math.min(1, (now - start) / duration);
        const current = target * easeOutCubic(progress);
        setDisplay(formatStatValue(parsed, current));
        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          setDisplay(parsed.display);
        }
      };

      requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          runAnimation();
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [parsed]);

  return (
    <span ref={ref} className={className} aria-label={value}>
      {display}
    </span>
  );
}

export function AnimatedStatValue({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const parsed = useMemo(() => parseStatValue(value), [value]);
  const prefersReducedMotion = usePrefersReducedMotion();

  if (!parsed.animatable || prefersReducedMotion) {
    return (
      <span className={className} aria-label={value}>
        {parsed.display}
      </span>
    );
  }

  return (
    <AnimatedStatValueInner
      key={value}
      parsed={parsed}
      value={value}
      className={className}
    />
  );
}
