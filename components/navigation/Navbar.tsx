"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

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

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") setIsOpen(false); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen]);

  return (
    <div className="relative">
      <nav data-component="navbar" className="w-full border-b border-border bg-background py-4">
        <div
          className="mx-auto flex max-w-6xl items-center justify-between"
          style={{ paddingInline: "var(--page-inset)" }}
        >
          <Link href="/" className="text-lg font-bold text-foreground">{logo}</Link>

          {/* Desktop links + CTA */}
          <div className="hidden md:flex items-center gap-6">
            {links?.map((link, i) => (
              <a key={`${i}-${link.href}`} href={link.href} className="text-sm text-muted hover:text-foreground">
                {link.label}
              </a>
            ))}
            {ctaLabel && (
              <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-fg hover:opacity-90">
                {ctaLabel}
              </button>
            )}
          </div>

          {/* Hamburger button (mobile only) */}
          <button
            type="button"
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
            onClick={() => setIsOpen((v) => !v)}
            className="md:hidden flex items-center justify-center w-9 h-9 text-foreground"
          >
            {isOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile menu panel */}
      <div
        data-component="mobile-menu"
        aria-hidden={!isOpen}
        className={[
          "md:hidden fixed inset-x-0 top-[57px] bottom-0 z-40 bg-background border-t border-border overflow-y-auto",
          "transition-[opacity,transform] duration-200 ease-out",
          isOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-2 pointer-events-none",
        ].join(" ")}
      >
        <nav className="flex flex-col py-6 gap-1" style={{ paddingInline: "var(--page-inset)" }}>
          {links?.map((link, i) => (
            <a
              key={`${i}-${link.href}`}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="text-base text-foreground hover:text-primary py-3 border-b border-border/40"
            >
              {link.label}
            </a>
          ))}
          {ctaLabel && ctaAction && (
            <a
              href={ctaAction}
              onClick={() => setIsOpen(false)}
              className="mt-4 rounded-md bg-primary px-4 py-3 text-center text-sm font-medium text-primary-fg hover:opacity-90"
            >
              {ctaLabel}
            </a>
          )}
        </nav>
      </div>
    </div>
  );
}
