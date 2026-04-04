"use client";

const sizeMap = { sm: "text-sm", base: "text-base", lg: "text-lg", xl: "text-xl" };
const colorMap = { default: "text-foreground", muted: "text-muted", white: "text-primary-fg" };
const weightMap = { normal: "font-normal", medium: "font-medium", semibold: "font-semibold" };
const alignMap = { left: "text-left", center: "text-center", right: "text-right" };

export function Text({
  content,
  size = "base",
  color = "default",
  weight = "normal",
  align = "left",
}: {
  content: string;
  size?: "sm" | "base" | "lg" | "xl" | null;
  color?: "default" | "muted" | "white" | null;
  weight?: "normal" | "medium" | "semibold" | null;
  align?: "left" | "center" | "right" | null;
}) {
  return (
    <p data-component="text" className={`${sizeMap[size ?? "base"]} ${colorMap[color ?? "default"]} ${weightMap[weight ?? "normal"]} ${alignMap[align ?? "left"]}`}>
      {content}
    </p>
  );
}
