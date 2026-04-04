const variantMap: Record<string, string> = {
  primary: "bg-primary text-primary-fg hover:opacity-90",
  secondary: "border border-border bg-background text-foreground hover:bg-muted-bg",
  ghost: "text-foreground hover:bg-muted-bg",
  destructive: "bg-destructive text-destructive-fg hover:opacity-90",
};

const sizeMap: Record<string, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

interface ButtonProps {
  label: string;
  variant?: string | null;
  size?: string | null;
  disabled?: boolean | null;
  onClick?: () => void;
}

export function Button({ label, variant, size, disabled, onClick }: ButtonProps) {
  const variantClass = variantMap[variant ?? "primary"] ?? "bg-primary text-primary-fg hover:opacity-90";
  const sizeClass = sizeMap[size ?? "md"] ?? "px-4 py-2 text-sm";
  return (
    <button
      data-component="button"
      onClick={onClick}
      disabled={disabled ?? false}
      className={`rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variantClass} ${sizeClass}`}
    >
      {label}
    </button>
  );
}
