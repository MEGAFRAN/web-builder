interface Testimonial {
  quote: string;
  author: string;
  role?: string | null;
  avatar?: string | null;
}

interface TestimonialsProps {
  title?: string | null;
  testimonials: Testimonial[];
}

export function Testimonials({ title, testimonials }: TestimonialsProps) {
  const cols =
    (testimonials?.length ?? 0) > 1 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1";
  return (
    <div data-component="testimonials" className="w-full bg-muted-bg px-6 py-16">
      <div className="mx-auto max-w-6xl">
        {title && (
          <h2 className="mb-12 text-center text-3xl font-bold text-foreground">{title}</h2>
        )}
        <div className={`grid ${cols} gap-8`}>
          {testimonials?.map((t, i) => (
            <div key={i} className="rounded-xl border border-border bg-background p-8">
              <p className="mb-6 text-lg leading-relaxed text-foreground">"{t.quote}"</p>
              <div className="flex items-center gap-3">
                {t.avatar && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={t.avatar}
                    alt={t.author}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                )}
                <div>
                  <p className="font-semibold text-foreground">{t.author}</p>
                  {t.role && <p className="text-sm text-muted">{t.role}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
