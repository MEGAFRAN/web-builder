const variantMap: Record<string, string> = {
  default: "bg-muted-bg text-foreground",
  success: "bg-green-100 text-green-700",
  warning: "bg-yellow-100 text-yellow-700",
  error: "bg-red-100 text-red-700",
};

interface BadgeProps {
  label: string;
  variant?: string | null;
}

export function Badge({ label, variant }: BadgeProps) {
  const styles = variantMap[variant ?? "default"] ?? "bg-muted-bg text-foreground";
  return (
    <span data-component="badge" className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles}`}>
      {label}
    </span>
  );
}
