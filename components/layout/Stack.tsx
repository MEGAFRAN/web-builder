"use client";
import { ReactNode } from "react";

const gapMap = { none: "gap-0", sm: "gap-2", md: "gap-4", lg: "gap-8", xl: "gap-12" };
const alignMap = { start: "items-start", center: "items-center", end: "items-end", stretch: "items-stretch" };

export function Stack({
  children,
  gap = "md",
  align = "stretch",
}: {
  children?: ReactNode;
  gap?: keyof typeof gapMap | null;
  align?: keyof typeof alignMap | null;
}) {
  return (
    <div data-component="stack" className={`flex flex-col ${gapMap[gap ?? "md"]} ${alignMap[align ?? "stretch"]}`}>
      {children}
    </div>
  );
}
