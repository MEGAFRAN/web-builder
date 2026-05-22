"use client";
import { ReactNode } from "react";

const maxWidthMap = {
  sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg",
  xl: "max-w-xl", "2xl": "max-w-2xl", full: "max-w-full",
};
const paddingMap = { none: "", sm: "px-4", md: "px-6", lg: "px-8" };

export function Container({
  children,
  maxWidth = "xl",
  padding = "theme",
}: {
  children?: ReactNode;
  maxWidth?: keyof typeof maxWidthMap | null;
  padding?: keyof typeof paddingMap | "theme" | null;
}) {
  const paddingClass =
    padding && padding !== "theme" ? paddingMap[padding] : "";

  const className = [
    "mx-auto",
    "w-full",
    maxWidthMap[maxWidth ?? "xl"],
    padding === "theme" ? "px-4 sm:px-6 md:[padding-inline:var(--page-inset)]" : "",
    paddingClass,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div data-component="container" className={className}>
      {children}
    </div>
  );
}
