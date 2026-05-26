"use client";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import { Image } from "@/components/content/Image";
import {
  dispatchOpenBookingModal,
  isBookingModalHref,
} from "@/lib/booking-modal-events";

const HERO_CTA_CLASS =
  "rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-fg transition-colors duration-150 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

const MOBILE_FULL_VIEWPORT_SECTION_CLASS =
  "max-md:min-h-[calc(100svh-7rem)] max-md:flex max-md:flex-col max-md:justify-center";

const HERO_VISUAL_BG_SECTION_CLASS = "relative isolate overflow-hidden";

const HERO_PHOTO_OVERLAY_CLASS =
  "pointer-events-none absolute inset-0 z-[1] hero-photo-overlay";

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

function buildSectionClassName({
  fullViewportHeightMobile,
  hasPhotoBackground,
  hasGradientFallback,
}: {
  fullViewportHeightMobile: boolean;
  hasPhotoBackground: boolean;
  hasGradientFallback: boolean;
}): string | undefined {
  const classes = [
    fullViewportHeightMobile ? MOBILE_FULL_VIEWPORT_SECTION_CLASS : null,
    hasPhotoBackground || hasGradientFallback ? HERO_VISUAL_BG_SECTION_CLASS : null,
    hasPhotoBackground ? "bg-surface-dark" : null,
    hasGradientFallback ? "hero-bg-gradient" : null,
  ].filter(Boolean);

  return classes.length > 0 ? classes.join(" ") : undefined;
}

export function Hero({
  headline,
  subtext,
  ctaLabel,
  ctaAction,
  align = "center",
  fullViewportHeightMobile = false,
  backgroundImageUrl,
  gradientFallback = false,
}: {
  headline: string;
  subtext?: string | null;
  ctaLabel?: string | null;
  ctaAction?: string | null;
  align?: "left" | "center" | null;
  /** Fills the mobile viewport below the navbar and bottom action bar. */
  fullViewportHeightMobile?: boolean;
  backgroundImageUrl?: string | null;
  /** Applies a theme gradient when no background image is configured. */
  gradientFallback?: boolean;
}) {
  const photoBackgroundSrc = backgroundImageUrl?.trim() ?? "";
  const hasPhotoBackground = Boolean(photoBackgroundSrc);
  const hasGradientFallback = gradientFallback && !hasPhotoBackground;
  const hasVisualBackground = hasPhotoBackground || hasGradientFallback;
  const textAlign = align === "left" ? "text-left items-start" : "text-center items-center";
  const headlineClass = hasPhotoBackground
    ? "text-5xl font-bold leading-tight tracking-tight text-white md:text-6xl"
    : "text-5xl font-bold leading-tight tracking-tight text-brand md:text-6xl";
  const subtextClass = hasPhotoBackground
    ? "max-w-xl text-lg text-white"
    : "max-w-xl text-lg text-muted";
  const heroContentClass = [
    "relative z-[2] flex flex-col gap-6",
    textAlign,
    hasPhotoBackground ? "w-full max-w-2xl" : null,
    hasPhotoBackground && align === "left" ? "self-start" : null,
    hasPhotoBackground && align !== "left" ? "mx-auto" : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Section
      paddingY="lg"
      visualBg={hasVisualBackground}
      className={buildSectionClassName({
        fullViewportHeightMobile,
        hasPhotoBackground,
        hasGradientFallback,
      })}
    >
      {hasPhotoBackground && (
        <>
          <Image
            src={photoBackgroundSrc}
            alt=""
            fill
            fetchPriority="high"
            loading="eager"
            objectFit="cover"
          />
          <div
            data-component="hero-photo-overlay"
            className={HERO_PHOTO_OVERLAY_CLASS}
            aria-hidden="true"
          />
        </>
      )}

      <Container maxWidth="xl" padding="theme">
        <div
          data-component="hero"
          data-hero-bg={hasPhotoBackground ? "photo" : hasGradientFallback ? "gradient" : "solid"}
          className={heroContentClass}
        >
          <h1 className={headlineClass}>{headline}</h1>
          {subtext && <p className={subtextClass}>{subtext}</p>}
          {ctaLabel && <HeroCta label={ctaLabel} href={ctaAction} />}
        </div>
      </Container>
    </Section>
  );
}
