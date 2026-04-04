import { ReactNode } from "react";

const colsMap: Record<string, string> = {
  "1": "grid-cols-1",
  "2": "grid-cols-1 sm:grid-cols-2",
  "3": "grid-cols-1 sm:grid-cols-3",
  "4": "grid-cols-1 sm:grid-cols-4",
};

const gapMap: Record<string, string> = {
  none: "gap-0",
  sm: "gap-2",
  md: "gap-4",
  lg: "gap-8",
};

interface GridProps {
  cols?: string | null;
  gap?: string | null;
  children?: ReactNode;
}

export function Grid({ cols, gap, children }: GridProps) {
  const colsClass = colsMap[cols ?? "3"] ?? "grid-cols-1 sm:grid-cols-3";
  const gapClass = gapMap[gap ?? "md"] ?? "gap-4";
  return <div data-component="grid" className={`grid ${colsClass} ${gapClass}`}>{children}</div>;
}
