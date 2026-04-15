import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import { Stack } from "@/components/layout/Stack";

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
    <Section background="gray" paddingY="lg">
      <Container maxWidth="2xl" padding="theme">
        <div data-component="testimonials">
          <Stack gap="lg">
            {title && (
              <h2 className="text-center text-3xl font-bold text-foreground">{title}</h2>
            )}
            <div className={`grid ${cols} gap-8`}>
              {testimonials?.map((t, i) => (
                <div key={i} className="rounded-xl border border-border bg-background p-8">
                  <Stack gap="lg">
                    <p className="text-lg leading-relaxed text-foreground">"{t.quote}"</p>
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
                  </Stack>
                </div>
              ))}
            </div>
          </Stack>
        </div>
      </Container>
    </Section>
  );
}
