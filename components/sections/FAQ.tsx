"use client";
import { useState } from "react";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import { Stack } from "@/components/layout/Stack";

interface FAQProps {
  title?: string | null;
  items: Array<{ question: string; answer: string }>;
}

export function FAQ({ title, items }: FAQProps) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <Section paddingY="lg">
      <Container maxWidth="2xl" padding="theme">
        <div data-component="faq">
          <div className="mx-auto max-w-3xl">
            <Stack gap="lg">
              {title && (
                <h2 className="text-center text-3xl font-bold text-foreground">{title}</h2>
              )}
              <div className="divide-y divide-border">
                {items?.map((item, i) => (
                  <div key={i} className="py-5">
                    <button
                      onClick={() => setOpen(open === i ? null : i)}
                      className="flex w-full items-center justify-between text-left"
                    >
                      <span className="font-medium text-foreground">{item.question}</span>
                      <span className="ml-6 text-muted text-xl leading-none">
                        {open === i ? "−" : "+"}
                      </span>
                    </button>
                    {open === i && <p className="mt-3 text-muted">{item.answer}</p>}
                  </div>
                ))}
              </div>
            </Stack>
          </div>
        </div>
      </Container>
    </Section>
  );
}
