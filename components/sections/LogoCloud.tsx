interface LogoCloudProps {
  title?: string | null;
  logos: Array<{ src?: string | null; alt: string; name?: string | null }>;
}

export function LogoCloud({ title, logos }: LogoCloudProps) {
  return (
    <div data-component="logo-cloud" className="w-full px-6 py-12">
      <div className="mx-auto max-w-6xl">
        {title && (
          <p className="mb-8 text-center text-sm text-muted">{title}</p>
        )}
        <div className="flex flex-wrap items-center justify-center gap-8">
          {logos?.map((logo, i) =>
            logo.src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={logo.src}
                alt={logo.alt}
                className="h-8 object-contain grayscale opacity-60 transition-opacity hover:opacity-100"
              />
            ) : (
              <span key={i} className="text-sm font-semibold text-muted">
                {logo.name ?? logo.alt}
              </span>
            )
          )}
        </div>
      </div>
    </div>
  );
}
