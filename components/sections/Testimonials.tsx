"use client";

import { useState } from "react";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import { Stack } from "@/components/layout/Stack";
import { Button } from "@/components/inputs/Button";

interface Testimonial {
  quote: string;
  author: string;
  role?: string | null;
  company?: string | null;
  avatar?: string | null;
}

interface TestimonialsProps {
  title?: string | null;
  testimonials: Testimonial[];
}

export function Testimonials({ title, testimonials }: TestimonialsProps) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? testimonials : testimonials?.slice(0, 1);

  return (
    <Section background="gray" paddingY="lg">
      <Container maxWidth="2xl" padding="theme">
        <div data-component="testimonials">
          <Stack gap="lg">
            {title && (
              <h2 className="text-center text-3xl font-bold text-foreground">{title}</h2>
            )}
            <Stack gap="xl">
              {visible?.map((t, i) => (
                <blockquote
                  key={i}
                  className="rounded-xl border border-border bg-background p-8"
                >
                  <Stack gap="lg">
                    <p className="text-lg leading-relaxed text-foreground">
                      {t.quote}
                    </p>
                    <footer className="flex items-center gap-3">
                      {t.avatar && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={t.avatar}
                          alt=""
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <span className="font-semibold text-foreground">{t.author}, </span>
                        {t.role && <span className="text-sm text-muted">{t.role}</span>}
                        {t.company && <p className="text-sm text-muted">{t.company}</p>}
                      </div>
                    </footer>
                  </Stack>
                </blockquote>
              ))}
            </Stack>
            {(testimonials?.length ?? 0) > 1 && !showAll && (
              <div className="flex justify-center">
                <Button
                  label="Show all testimonials"
                  variant="secondary"
                  onClick={() => setShowAll(true)}
                />
              </div>
            )}
          </Stack>
        </div>
      </Container>
    </Section>
  );
}
