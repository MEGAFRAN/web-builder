interface NavLinkProps {
  label: string;
  href: string;
  active?: boolean | null;
}

export function NavLink({ label, href, active }: NavLinkProps) {
  return (
    <a
      data-component="nav-link"
      href={href}
      className={`text-sm transition-colors ${
        active
          ? "font-medium text-foreground"
          : "text-muted hover:text-foreground"
      }`}
    >
      {label}
    </a>
  );
}
