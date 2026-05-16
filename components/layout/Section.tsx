"use client";
import { ReactNode, CSSProperties } from "react";

const bgMap = {
  white: "bg-background",
  gray: "bg-muted-bg",
  dark: "bg-primary",
};

const pyScale: Record<string, string | 0> = {
  none: 0,
  sm:   'calc(var(--section-spacing) * 0.4)',
  md:   'calc(var(--section-spacing) * 0.6)',
  lg:   'var(--section-spacing)',
  xl:   'calc(var(--section-spacing) * 1.4)',
}

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
  dataComponent = "section",
}: {
  children?: ReactNode;
  background?: keyof typeof bgMap | null;
  paddingY?: keyof typeof pyScale | null;
  fullBleed?: boolean;
  /** Overrides the root `data-component` attribute (e.g. block-level integration tests). */
  dataComponent?: string;
}) {
  const py = pyScale[paddingY ?? "lg"]
  const sectionStyle: CSSProperties = { paddingBlock: py === 0 ? 0 : py }

  return (
    <section
      data-component={dataComponent}
      data-full-bleed={fullBleed ? "true" : undefined}
      className={`w-full ${bgMap[background ?? "white"]}`}
      style={sectionStyle}
    >
      {children}
    </section>
  );
}
