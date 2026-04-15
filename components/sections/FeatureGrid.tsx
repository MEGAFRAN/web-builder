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
}

export function FeatureGrid({ title, subtitle, features, cols }: FeatureGridProps) {
  const colsClass = colsMap[cols ?? "3"] ?? "grid-cols-1 sm:grid-cols-3";
  return (
    <Section paddingY="lg">
      <Container maxWidth="2xl" padding="theme">
        <div data-component="feature-grid">
          <Stack gap="lg">
            {(title || subtitle) && (
              <Stack gap="lg">
                {title && (
                  <h2 className="text-center text-3xl font-bold text-foreground">
                    {title}
                  </h2>
                )}
                {subtitle && (
                  <p className="text-center text-lg text-muted">{subtitle}</p>
                )}
              </Stack>
            )}
            <div className={`grid ${colsClass} gap-8`}>
              {features?.map((f, i) => (
                <div key={i} className="flex flex-col gap-3">
                  {f.icon && <span className="text-2xl">{f.icon}</span>}
                  <h3 className="text-lg font-semibold text-foreground">{f.title}</h3>
                  <p className="text-muted">{f.description}</p>
                </div>
              ))}
            </div>
          </Stack>
        </div>
      </Container>
    </Section>
  );
}
