const sizeMap: Record<string, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
};

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: string | null;
}

export function Avatar({ src, name, size }: AvatarProps) {
  const sizeClass = sizeMap[size ?? "md"] ?? "h-10 w-10 text-sm";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} className={`${sizeClass} rounded-full object-cover`} />;
  }

  return (
    <div data-component="avatar" className={`${sizeClass} flex items-center justify-center rounded-full bg-muted-bg font-medium text-muted`}>
      {initials}
    </div>
  );
}
