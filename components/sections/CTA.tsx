"use client";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";

const bgMap = {
  white: "white",
  gray: "gray",
  dark: "dark",
} as const;

export function CTA({
  headline,
  subtext,
  ctaLabel,
  background = "gray",
}: {
  headline: string;
  subtext?: string | null;
  ctaLabel: string;
  ctaAction?: string | null;
  background?: "white" | "gray" | "dark" | null;
}) {
  const bg = bgMap[background ?? "gray"];
  const isDark = background === "dark";
  return (
    <Section background={bg} paddingY="lg">
      <Container maxWidth="xl" padding="theme">
        <div data-component="cta" className="flex flex-col items-center gap-6 text-center">
          <h2 className={`text-4xl font-bold tracking-tight ${isDark ? "text-primary-fg" : "text-brand"}`}>{headline}</h2>
          {subtext && <p className={`max-w-xl text-lg ${isDark ? "text-primary-fg-muted" : "text-muted"}`}>{subtext}</p>}
          <button className={`rounded-md px-6 py-3 text-sm font-medium ${isDark ? "bg-background text-foreground hover:bg-muted-bg" : "bg-primary text-primary-fg hover:opacity-90"}`}>
            {ctaLabel}
          </button>
        </div>
      </Container>
    </Section>
  );
}
