"use client";

export function Navbar({
  logo,
  links,
  ctaLabel,
}: {
  logo: string;
  links?: { label: string; href: string }[] | null;
  ctaLabel?: string | null;
  ctaAction?: string | null;
}) {
  return (
    <nav data-component="navbar" className="w-full border-b border-border bg-background px-6 py-4">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <span className="text-lg font-bold text-foreground">{logo}</span>
        <div className="flex items-center gap-6">
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
      </div>
    </nav>
  );
}
