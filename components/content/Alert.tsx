const variantMap: Record<string, string> = {
  info: "bg-blue-50 border-blue-200 text-blue-800",
  success: "bg-green-50 border-green-200 text-green-800",
  warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
  error: "bg-red-50 border-red-200 text-red-800",
};

interface AlertProps {
  title?: string | null;
  message: string;
  variant?: string | null;
}

export function Alert({ title, message, variant }: AlertProps) {
  const styles = variantMap[variant ?? "info"] ?? "bg-blue-50 border-blue-200 text-blue-800";
  return (
    <div data-component="alert" className={`rounded-lg border p-4 ${styles}`}>
      {title && <p className="mb-1 font-semibold">{title}</p>}
      <p>{message}</p>
    </div>
  );
}
