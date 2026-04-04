interface PricingTier {
  name: string;
  price: string;
  period?: string | null;
  description?: string | null;
  features: string[];
  ctaLabel: string;
  ctaAction?: string | null;
  highlighted?: boolean | null;
}

interface PricingTableProps {
  title?: string | null;
  subtitle?: string | null;
  tiers: PricingTier[];
  onPress?: () => void;
}

export function PricingTable({ title, subtitle, tiers, onPress }: PricingTableProps) {
  const gridCols =
    tiers?.length === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-3";
  return (
    <div data-component="pricing-table" className="w-full px-6 py-16">
      <div className="mx-auto max-w-5xl">
        {title && (
          <h2 className="mb-4 text-center text-3xl font-bold text-foreground">{title}</h2>
        )}
        {subtitle && (
          <p className="mb-12 text-center text-lg text-muted">{subtitle}</p>
        )}
        <div className={`grid ${gridCols} gap-8`}>
          {tiers?.map((tier, i) => (
            <div
              key={i}
              className={`flex flex-col rounded-xl border p-8 ${
                tier.highlighted ? "border-primary shadow-lg" : "border-border"
              }`}
            >
              {tier.highlighted && (
                <span className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  Recommended
                </span>
              )}
              <h3 className="text-xl font-bold text-foreground">{tier.name}</h3>
              <div className="mb-2 mt-4">
                <span className="text-4xl font-bold text-foreground">{tier.price}</span>
                {tier.period && <span className="ml-1 text-muted">{tier.period}</span>}
              </div>
              {tier.description && (
                <p className="mb-6 text-muted">{tier.description}</p>
              )}
              <ul className="mb-8 flex-1 space-y-3">
                {tier.features?.map((feature, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="mt-0.5 text-muted">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={onPress}
                className={`w-full rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
                  tier.highlighted
                    ? "bg-primary text-primary-fg hover:opacity-90"
                    : "border border-border text-foreground hover:bg-muted-bg"
                }`}
              >
                {tier.ctaLabel}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
