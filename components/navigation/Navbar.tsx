"use client";

import Link from "next/link";
import { useState, useEffect, type CSSProperties } from "react";
import { NavLink } from "@/components/navigation/NavLink";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import { useMinWidth } from "@/lib/hooks/useMinWidth";
import {
  dispatchOpenBookingModal,
  isBookingModalHref,
} from "@/lib/booking-modal-events";
import { getExternalLinkProps } from "@/lib/link-props";

const NAVBAR_SHADOW =
  "shadow-[0_1px_0_color-mix(in_srgb,var(--color-text)_8%,transparent)]";
const NAVBAR_SCROLLED_SHADOW =
  "shadow-[0_4px_24px_color-mix(in_srgb,var(--color-text)_8%,transparent)]";

const DESKTOP_CTA_CLASS =
  "rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-fg transition-colors duration-150 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

const NAV_POSITION =
  "fixed inset-x-0 top-0 z-40 w-full md:static md:sticky md:top-0";

const MOBILE_CTA_CLASS =
  "mt-4 rounded-md bg-primary px-4 py-3 text-center text-sm font-medium text-primary-fg transition-colors duration-150 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

const DEFAULT_NAVBAR_HEIGHT = "4.5rem";

function NavbarCta({
  label,
  href,
  className,
  onActivate,
}: {
  label: string;
  href: string;
  className: string;
  onActivate?: () => void;
}) {
  if (isBookingModalHref(href)) {
    return (
      <button
        type="button"
        className={`${className} cursor-pointer border-0`}
        onClick={() => {
          onActivate?.();
          dispatchOpenBookingModal();
        }}
      >
        {label}
      </button>
    );
  }

  return (
    <a
      href={href}
      className={className}
      onClick={onActivate}
      {...getExternalLinkProps(href)}
    >
      {label}
    </a>
  );
}

export function Navbar({
  logo,
  links,
  ctaLabel,
  ctaAction,
}: {
  logo: string;
  links?: { label: string; href: string }[] | null;
  ctaLabel?: string | null;
  ctaAction?: string | null;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const reduceMotion = usePrefersReducedMotion();
  const isDesktop = useMinWidth(768);

  const toggleMobileMenu = () => setIsOpen((open) => !open);

  const handleMobileNavClick = () => {
    if (isDesktop) return;
    toggleMobileMenu();
  };

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen]);

  const navSurface = "border-b border-border bg-surface";
  const navShadow = isScrolled ? NAVBAR_SCROLLED_SHADOW : NAVBAR_SHADOW;
  const navTransition = reduceMotion
    ? ""
    : "transition-[box-shadow,background-color] duration-200";

  return (
    <>
      <nav
        data-component="navbar"
        data-scrolled={isScrolled ? "true" : "false"}
        style={{ "--navbar-height": DEFAULT_NAVBAR_HEIGHT } as CSSProperties}
        onClick={handleMobileNavClick}
        className={`${NAV_POSITION} max-md:cursor-pointer py-4 ${navSurface} ${navShadow} ${navTransition}`}
      >
        <div
          className="mx-auto flex max-w-6xl items-center justify-between"
          style={{ paddingInline: "var(--page-inset)" }}
        >
          <Link
            href="/"
            onClick={(event) => {
              event.stopPropagation();
              setIsOpen(false);
            }}
            className="cursor-pointer font-[family-name:var(--font-heading)] text-xl font-semibold tracking-tight text-brand transition-colors duration-150 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 md:text-2xl"
          >
            {logo}
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            {links?.map((link, i) => (
              <NavLink key={`${i}-${link.href}`} label={link.label} href={link.href} />
            ))}
            {ctaLabel &&
              (ctaAction ? (
                <NavbarCta
                  label={ctaLabel}
                  href={ctaAction}
                  className={DESKTOP_CTA_CLASS}
                />
              ) : (
                <button className={DESKTOP_CTA_CLASS}>
                  {ctaLabel}
                </button>
              ))}
          </div>

          <button
            type="button"
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
            onClick={(event) => {
              event.stopPropagation();
              toggleMobileMenu();
            }}
            className="flex h-9 w-9 items-center justify-center text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 md:hidden"
          >
            {isOpen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      <div
        aria-hidden
        className="h-[var(--navbar-height,4.5rem)] shrink-0 md:hidden"
      />

      <div
        data-component="mobile-menu"
        aria-hidden={!isOpen}
        className={[
          "fixed inset-x-0 bottom-0 z-40 overflow-y-auto border-t border-border bg-surface md:hidden",
          "top-[var(--navbar-height,4.5rem)]",
          reduceMotion ? "" : "transition-[opacity,transform] duration-200 ease-out",
          isOpen
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-2 opacity-0",
        ].join(" ")}
      >
        <nav
          className="flex flex-col gap-1 py-6"
          style={{ paddingInline: "var(--page-inset)" }}
        >
          {links?.map((link, i) => (
            <a
              key={`${i}-${link.href}`}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="border-b border-border/40 py-3 text-xl font-bold text-foreground transition-colors duration-150 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {link.label}
            </a>
          ))}
          {ctaLabel && ctaAction && (
            <NavbarCta
              label={ctaLabel}
              href={ctaAction}
              className={MOBILE_CTA_CLASS}
              onActivate={() => setIsOpen(false)}
            />
          )}
        </nav>
      </div>
    </>
  );
}
