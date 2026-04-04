interface BreadcrumbProps {
  items: Array<{ label: string; href?: string | null }>;
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav data-component="breadcrumb" className="flex items-center gap-2 text-sm text-muted">
      {items?.map((item, i) => (
        <span key={i} className="flex items-center gap-2">
          {i > 0 && <span>/</span>}
          {item.href ? (
            <a href={item.href} className="transition-colors hover:text-foreground">
              {item.label}
            </a>
          ) : (
            <span className="text-foreground">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
