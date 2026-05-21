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
      className={`text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
        active
          ? "font-medium text-foreground"
          : "text-muted hover:text-primary"
      }`}
    >
      {label}
    </a>
  );
}
