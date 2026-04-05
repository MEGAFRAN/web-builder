const bgMap: Record<string, string> = {
  white: "bg-background",
  gray: "bg-muted-bg",
  dark: "bg-primary",
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
  const colCount = Math.min(stats?.length ?? 0, 4);
  return (
    <div data-component="stats-bar" className={`w-full px-6 py-12 ${bgMap[bg] ?? "bg-background"}`}>
      <div className="mx-auto max-w-6xl">
        <dl className={`grid ${colsMap[colCount] ?? "grid-cols-4"} gap-8 text-center`}>
          {stats?.map((stat, i) => (
            <div key={i}>
              <dt className={`text-4xl font-bold ${valueColorMap[bg] ?? "text-foreground"}`}>
                {stat.value}
              </dt>
              <dd className={`mt-2 text-sm ${labelColorMap[bg] ?? "text-muted"}`}>
                {stat.label}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
