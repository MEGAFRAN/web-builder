"use client";
import { ReactNode } from "react";

const bgMap = {
  white: "bg-background",
  gray: "bg-muted-bg",
  dark: "bg-primary",
};
const pyMap = { none: "", sm: "py-8", md: "py-12", lg: "py-20", xl: "py-28" };

/**
 * Layout contract:
 *   Section  → full-width background color + vertical padding (paddingY prop)
 *   Container → horizontal inset via var(--page-inset) + max-width centering
 *   Stack/Grid → internal layout only (gaps, columns)
 *   Content  → Heading, Text, Card, etc.
 *
 * Inter-section vertical rhythm is controlled exclusively by `paddingY`.
 * No child component may apply px-*, mx-*, mt-*, or mb-* on its own root element.
 *
 * Two valid structures:
 *   Standard:   <Section><Container><Stack>{content}</Stack></Container></Section>
 *   Full-bleed: <Section fullBleed>{direct content}</Section>
 */
export function Section({
  children,
  background = "white",
  paddingY = "lg",
  fullBleed = false,
}: {
  children?: ReactNode;
  background?: keyof typeof bgMap | null;
  paddingY?: keyof typeof pyMap | null;
  fullBleed?: boolean;
}) {
  return (
    <section
      data-component="section"
      data-full-bleed={fullBleed ? "true" : undefined}
      className={`w-full ${bgMap[background ?? "white"]} ${pyMap[paddingY ?? "lg"]}`}
    >
      {children}
    </section>
  );
}
