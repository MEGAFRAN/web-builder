"use client";

const bgMap = {
  white: "bg-background",
  gray: "bg-muted-bg",
  dark: "bg-primary",
};

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
    <div data-component="cta" className={`flex flex-col items-center gap-6 px-6 py-20 text-center ${bg}`}>
      <h2 className={`text-3xl font-bold ${isDark ? "text-primary-fg" : "text-foreground"}`}>{headline}</h2>
      {subtext && <p className={`max-w-xl text-lg ${isDark ? "text-primary-fg/70" : "text-muted"}`}>{subtext}</p>}
      <button className={`rounded-md px-6 py-3 text-sm font-medium ${isDark ? "bg-background text-foreground hover:bg-muted-bg" : "bg-primary text-primary-fg hover:opacity-90"}`}>
        {ctaLabel}
      </button>
    </div>
  );
}
