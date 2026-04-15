"use client";
import { ReactNode, CSSProperties } from "react";

const gapScale: Record<string, string | 0> = {
  none: 0,
  sm:   'calc(var(--content-gap) * 0.5)',
  md:   'var(--content-gap)',
  lg:   'calc(var(--content-gap) * 2)',
  xl:   'calc(var(--content-gap) * 3)',
}
const alignMap = { start: "items-start", center: "items-center", end: "items-end", stretch: "items-stretch" };

export function Stack({
  children,
  gap = "md",
  align = "stretch",
}: {
  children?: ReactNode;
  gap?: keyof typeof gapScale | null;
  align?: keyof typeof alignMap | null;
}) {
  const gapValue = gapScale[gap ?? "md"]
  const stackStyle: CSSProperties = { gap: gapValue === 0 ? 0 : gapValue }

  return (
    <div data-component="stack" className={`flex flex-col ${alignMap[align ?? "stretch"]}`} style={stackStyle}>
      {children}
    </div>
  );
}
