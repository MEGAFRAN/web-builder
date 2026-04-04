"use client";

export function Hero({
  headline,
  subtext,
  ctaLabel,
  secondaryLabel,
  align = "center",
}: {
  headline: string;
  subtext?: string | null;
  ctaLabel?: string | null;
  ctaAction?: string | null;
  secondaryLabel?: string | null;
  secondaryAction?: string | null;
  align?: "left" | "center" | null;
}) {
  const textAlign = align === "left" ? "text-left items-start" : "text-center items-center";
  return (
    <div data-component="hero" className={`flex flex-col gap-6 px-6 py-20 ${textAlign}`}>
      <h1 className="text-5xl font-bold tracking-tight text-foreground">{headline}</h1>
      {subtext && <p className="max-w-xl text-lg text-muted">{subtext}</p>}
      {(ctaLabel || secondaryLabel) && (
        <div className="flex flex-wrap gap-3">
          {ctaLabel && (
            <button className="rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-fg hover:opacity-90">
              {ctaLabel}
            </button>
          )}
          {secondaryLabel && (
            <button className="rounded-md border border-border px-6 py-3 text-sm font-medium text-foreground hover:bg-muted-bg">
              {secondaryLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
