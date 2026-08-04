import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import { Stack } from "@/components/layout/Stack";

const colsMap: Record<string, string> = {
  "2": "grid-cols-1 sm:grid-cols-2",
  "3": "grid-cols-1 sm:grid-cols-3",
};

interface FeatureGridProps {
  title?: string | null;
  subtitle?: string | null;
  features: Array<{ icon?: string | null; title: string; description: string }>;
  cols?: string | null;
  /** `card` (default) boxes each feature; `list` uses divider rows for non-interactive benefit scans. */
  variant?: "card" | "list" | null;
}

function resolveColsClass(
  cols: string | null | undefined,
  featureCount: number,
  variant: "card" | "list",
): string {
  if (variant === "list") {
    return "grid-cols-1";
  }
  if (cols != null && cols in colsMap) {
    return colsMap[cols];
  }
  if (cols == null && featureCount === 4) {
    return colsMap["2"];
  }
  return colsMap["3"];
}

const itemClassByVariant = {
  card: "flex h-full flex-col gap-3 rounded-[var(--radius)] bg-surface p-6 shadow-sm",
  list: "flex flex-col gap-2 border-b border-border py-5 last:border-b-0",
} as const;

export function FeatureGrid({
  title,
  subtitle,
  features,
  cols,
  variant: variantProp,
}: FeatureGridProps) {
  const variant = variantProp === "list" ? "list" : "card";
  const colsClass = resolveColsClass(cols, features?.length ?? 0, variant);
  const gridGapClass = variant === "list" ? "gap-0" : "gap-6 sm:gap-8";

  return (
    <Section paddingY="md">
      <Container maxWidth="2xl" padding="theme">
        <div data-component="feature-grid" data-variant={variant}>
          <Stack gap="lg">
            {(title || subtitle) && (
              <Stack gap="sm">
                {title && (
                  <h2 className="text-center text-4xl font-bold tracking-tight text-brand">
                    {title}
                  </h2>
                )}
                {subtitle && (
                  <p className="text-center text-lg text-muted">{subtitle}</p>
                )}
              </Stack>
            )}
            <div className={`grid ${colsClass} ${gridGapClass}`}>
              {features?.map((f, i) => (
                <div key={i} className={itemClassByVariant[variant]}>
                  {f.icon && <span className="text-2xl">{f.icon}</span>}
                  <h3 className="text-xl font-semibold text-foreground">{f.title}</h3>
                  <p className="text-base text-muted">{f.description}</p>
                </div>
              ))}
            </div>
          </Stack>
        </div>
      </Container>
    </Section>
  );
}
