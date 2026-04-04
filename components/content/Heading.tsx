"use client";

const alignMap = { left: "text-left", center: "text-center", right: "text-right" };
const colorMap = { default: "text-foreground", muted: "text-muted", white: "text-primary-fg" };
const sizeMap = { h1: "text-4xl font-bold", h2: "text-3xl font-bold", h3: "text-2xl font-semibold", h4: "text-xl font-semibold" };

export function Heading({
  text,
  level = "h2",
  align = "left",
  color = "default",
}: {
  text: string;
  level?: "h1" | "h2" | "h3" | "h4" | null;
  align?: "left" | "center" | "right" | null;
  color?: "default" | "muted" | "white" | null;
}) {
  const Tag = level ?? "h2";
  return (
    <Tag data-component="heading" className={`${sizeMap[Tag]} ${alignMap[align ?? "left"]} ${colorMap[color ?? "default"]}`}>
      {text}
    </Tag>
  );
}
