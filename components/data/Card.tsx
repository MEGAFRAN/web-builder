import { ReactNode } from "react";

const paddingMap: Record<string, string> = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

interface CardProps {
  title?: string | null;
  description?: string | null;
  footer?: string | null;
  padding?: string | null;
  border?: boolean | null;
  children?: ReactNode;
}

export function Card({ title, description, footer, padding, children }: CardProps) {
  const paddingClass = paddingMap[padding ?? "md"] ?? "p-6";
  return (
    <div data-component="card" className={`flex flex-col h-full rounded-lg bg-surface shadow-sm ${paddingClass}`}>
      {title && (
        <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
      )}
      {description && (
        <p className="mb-4 text-muted">{description}</p>
      )}
      {children}
      {footer && (
        <p className="mt-4 border-t border-border pt-4 text-sm text-muted">
          {footer}
        </p>
      )}
    </div>
  );
}
