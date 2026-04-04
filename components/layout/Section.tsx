"use client";
import { ReactNode } from "react";

const bgMap = {
  white: "bg-background",
  gray: "bg-muted-bg",
  dark: "bg-primary",
};
const pyMap = { none: "", sm: "py-8", md: "py-12", lg: "py-20", xl: "py-28" };

export function Section({
  children,
  background = "white",
  paddingY = "lg",
}: {
  children?: ReactNode;
  background?: keyof typeof bgMap | null;
  paddingY?: keyof typeof pyMap | null;
}) {
  return (
    <section data-component="section" className={`w-full ${bgMap[background ?? "white"]} ${pyMap[paddingY ?? "lg"]}`}>
      {children}
    </section>
  );
}
