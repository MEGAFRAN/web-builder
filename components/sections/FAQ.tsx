"use client";

import { useEffect, useRef, useState } from "react";
import { Section } from "@/components/layout/Section";
import { Container } from "@/components/layout/Container";
import { Stack } from "@/components/layout/Stack";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";

interface FAQProps {
  title?: string | null;
  items: Array<{ question: string; answer: string }>;
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <polyline points="5 8 10 13 15 8" />
    </svg>
  );
}

export function FAQ({ title, items }: FAQProps) {
  const [open, setOpen] = useState<number | null>(null);
  const reduceMotion = usePrefersReducedMotion();

  return (
    <Section paddingY="lg">
      <Container maxWidth="2xl" padding="theme">
        <div data-component="faq">
          <div className="mx-auto max-w-3xl">
            <Stack gap="lg">
              {title && (
                <h2 className="text-center text-4xl font-bold tracking-tight text-brand">
                  {title}
                </h2>
              )}
              <div className="flex flex-col gap-4">
                {items?.map((item, i) => (
                  <FaqItem
                    key={i}
                    item={item}
                    isOpen={open === i}
                    reduceMotion={reduceMotion}
                    onToggle={() => setOpen(open === i ? null : i)}
                    answerId={`faq-answer-${i}`}
                    buttonId={`faq-button-${i}`}
                  />
                ))}
              </div>
            </Stack>
          </div>
        </div>
      </Container>
    </Section>
  );
}

function FaqItem({
  item,
  isOpen,
  reduceMotion,
  onToggle,
  answerId,
  buttonId,
}: {
  item: { question: string; answer: string };
  isOpen: boolean;
  reduceMotion: boolean;
  onToggle: () => void;
  answerId: string;
  buttonId: string;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (!contentRef.current) return;
    setHeight(isOpen ? contentRef.current.scrollHeight : 0);
  }, [isOpen, item.answer]);

  return (
    <article className="rounded-[var(--radius)] border border-border bg-surface px-5 py-1">
      <button
        id={buttonId}
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={answerId}
        className="flex w-full items-center justify-between gap-4 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <span className="text-base font-semibold text-foreground md:text-lg">
          {item.question}
        </span>
        <ChevronIcon open={isOpen} />
      </button>
      <div
        id={answerId}
        role="region"
        aria-labelledby={buttonId}
        className="overflow-hidden"
        style={{
          height: reduceMotion ? "auto" : height,
          opacity: isOpen ? 1 : 0,
          transition: reduceMotion
            ? "none"
            : "height 0.25s ease, opacity 0.25s ease",
        }}
      >
        <div ref={contentRef} className="pb-5">
          <p className="text-base text-muted">{item.answer}</p>
        </div>
      </div>
    </article>
  );
}
