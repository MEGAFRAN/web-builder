"use client";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import {
  dispatchOpenBookingModal,
  isBookingModalHref,
} from "@/lib/booking-modal-events";

const bgMap = {
  white: "white",
  gray: "gray",
  dark: "dark",
} as const;

function CtaButton({
  label,
  href,
  isDark,
}: {
  label: string;
  href?: string | null;
  isDark: boolean;
}) {
  const className = `rounded-md px-6 py-3 text-sm font-medium ${
    isDark
      ? "bg-background text-foreground hover:bg-muted-bg"
      : "bg-primary text-primary-fg hover:opacity-90"
  }`;

  if (href && isBookingModalHref(href)) {
    return (
      <button
        type="button"
        className={`${className} cursor-pointer border-0`}
        onClick={() => dispatchOpenBookingModal()}
      >
        {label}
      </button>
    );
  }

  if (href) {
    return (
      <a href={href} className={className}>
        {label}
      </a>
    );
  }

  return <button className={className}>{label}</button>;
}

export function CTA({
  headline,
  subtext,
  ctaLabel,
  ctaAction,
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
          <CtaButton label={ctaLabel} href={ctaAction} isDark={isDark} />
        </div>
      </Container>
    </Section>
  );
}
