"use client";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import {
  dispatchOpenBookingModal,
  isBookingModalHref,
} from "@/lib/booking-modal-events";

const HERO_CTA_CLASS =
  "rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-fg transition-colors duration-150 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

function HeroCta({
  label,
  href,
}: {
  label: string;
  href?: string | null;
}) {
  if (href && isBookingModalHref(href)) {
    return (
      <button
        type="button"
        className={`${HERO_CTA_CLASS} cursor-pointer border-0`}
        onClick={() => dispatchOpenBookingModal()}
      >
        {label}
      </button>
    );
  }

  if (href) {
    return (
      <a href={href} className={HERO_CTA_CLASS}>
        {label}
      </a>
    );
  }

  return <button className={HERO_CTA_CLASS}>{label}</button>;
}

export function Hero({
  headline,
  subtext,
  ctaLabel,
  ctaAction,
  align = "center",
}: {
  headline: string;
  subtext?: string | null;
  ctaLabel?: string | null;
  ctaAction?: string | null;
  align?: "left" | "center" | null;
}) {
  const textAlign = align === "left" ? "text-left items-start" : "text-center items-center";
  return (
    <Section paddingY="lg">
      <Container maxWidth="xl" padding="theme">
        <div data-component="hero" className={`flex flex-col gap-6 ${textAlign}`}>
          <h1 className="text-5xl font-bold leading-tight tracking-tight text-brand md:text-6xl">{headline}</h1>
          {subtext && <p className="max-w-xl text-lg text-muted">{subtext}</p>}
          {ctaLabel && <HeroCta label={ctaLabel} href={ctaAction} />}
        </div>
      </Container>
    </Section>
  );
}
