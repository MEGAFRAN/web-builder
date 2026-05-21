"use client";

import { useEffect, useRef, useState } from "react";
import { formatStatValue, parseStatValue } from "@/lib/parse-stat-value";

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function AnimatedStatValue({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(value);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const parsed = parseStatValue(value);
    setDisplay(parsed.display);

    if (!parsed.animatable) {
      return;
    }

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

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      setDisplay(parsed.display);
      return;
    }

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
  }, [value]);

  return (
    <span ref={ref} className={className} aria-label={value}>
      {display}
    </span>
  );
}
