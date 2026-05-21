import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import { Stack } from "@/components/layout/Stack";
import { AnimatedStatValue } from "@/components/sections/AnimatedStatValue";

const bgMap: Record<string, "white" | "gray" | "dark"> = {
  white: "white",
  gray: "gray",
  dark: "dark",
};

const valueColorMap: Record<string, string> = {
  white: "text-foreground",
  gray: "text-foreground",
  dark: "text-primary-fg",
};

const labelColorMap: Record<string, string> = {
  white: "text-muted",
  gray: "text-muted",
  dark: "text-primary-fg-muted",
};

const colsMap: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
};

interface StatsBarProps {
  stats: Array<{ value: string; label: string }>;
  background?: string | null;
}

export function StatsBar({ stats, background }: StatsBarProps) {
  const bg = background ?? "white";
  const sectionBg = bgMap[bg] ?? "white";
  const colCount = Math.min(stats?.length ?? 0, 4);
  return (
    <Section data-component="stats-bar" background={sectionBg} paddingY="md">
      <Container maxWidth="2xl" padding="theme">
        <dl className={`grid ${colsMap[colCount] ?? "grid-cols-4"} gap-8 text-center`}>
          {stats?.map((stat, i) => (
            <div key={i}>
              <Stack gap="sm">
                <dt className={`text-4xl font-bold ${valueColorMap[bg] ?? "text-foreground"}`}>
                  <AnimatedStatValue value={stat.value} />
                </dt>
                <dd className={`text-sm ${labelColorMap[bg] ?? "text-muted"}`}>
                  {stat.label}
                </dd>
              </Stack>
            </div>
          ))}
        </dl>
      </Container>
    </Section>
  );
}
