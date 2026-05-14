'use client'

import { useState } from 'react'
import type {
  Service,
  ServiceSubItem,
  ServiceSubItemDescription,
  ServicesBlock as ServicesBlockType,
} from '@/types/cms'
import { Stack } from '@/components/layout/Stack'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { Image } from '@/components/content/Image'

function normalizeSubItem(entry: string | ServiceSubItem): ServiceSubItem {
  if (typeof entry === 'string') {
    return { label: entry }
  }
  return entry
}

function descriptionHasContent(desc: ServiceSubItemDescription | null | undefined): boolean {
  if (desc == null) return false
  if (desc.title.trim() !== '') return true
  return desc.items.some((line) => line.trim() !== '')
}

function ServiceSubItemsAccordion({
  subItems,
}: {
  subItems: NonNullable<Service['subItems']>
}) {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="divide-y divide-border border-t border-border pt-3" role="list">
      {subItems.map((raw, j) => {
        const item = normalizeSubItem(raw)
        const { label, price, duration, description } = item
        const hasDetails = Boolean(
          (price != null && price !== '') ||
            (duration != null && duration !== '') ||
            descriptionHasContent(description),
        )

        return (
          <div key={j} className="py-3 first:pt-0 last:pb-0" role="listitem">
            <button
              type="button"
              onClick={() => setOpen(open === j ? null : j)}
              className="flex w-full items-center justify-between gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              aria-expanded={open === j}
            >
              <span className="min-w-0 flex-1 text-sm font-bold text-foreground">
                {label}
              </span>
              <span className="shrink-0 text-xl leading-none text-muted" aria-hidden>
                {open === j ? '−' : '+'}
              </span>
            </button>
            {open === j && hasDetails ? (
              <div className="mt-3 space-y-2 text-sm text-muted">
                {price != null && price !== '' ? (
                  <span className="inline-flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-md px-2 py-0.5 outline outline-1 outline-offset-0 [outline-color:color-mix(in_srgb,var(--color-text)_15%,transparent)]">
                    <span>
                      <span className="sr-only">Price </span>
                      <span className="font-medium text-foreground">{price}</span>
                    </span>
                    {duration != null && duration !== '' ? (
                      <span>
                        <span className="sr-only">Duration </span>
                        {duration}
                      </span>
                    ) : null}
                  </span>
                ) : duration != null && duration !== '' ? (
                  <span>
                    <span className="sr-only">Duration </span>
                    {duration}
                  </span>
                ) : null}
                {description != null && descriptionHasContent(description) ? (
                  <div className="space-y-2">
                    {description.title.trim() !== '' ? (
                      <p>
                        <span className="sr-only">Description </span>
                        {description.title}
                      </p>
                    ) : null}
                    {description.items.some((l) => l.trim() !== '') ? (
                      <ul className="list-disc space-y-1 pl-5" role="list">
                        {description.items
                          .filter((l) => l.trim() !== '')
                          .map((line, k) => (
                            <li key={k}>{line}</li>
                          ))}
                      </ul>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

export default function ServicesBlock({ heading, items }: ServicesBlockType) {
  return (
    <Section paddingY="lg">
      <Container maxWidth="2xl" padding="theme">
        <section data-component="services-block">
          <div className="flex flex-col gap-8">
            {heading != null && heading !== '' && (
              <h2 className="text-center text-3xl font-bold text-foreground">{heading}</h2>
            )}
            {items.map((service, i) => (
              <article key={i} className="overflow-hidden rounded-lg border border-border">
                {service.imageUrl && (
                  <div className="relative aspect-[16/9] w-full">
                    <Image
                      src={service.imageUrl}
                      alt={service.imageAlt ?? service.title}
                      fill
                      objectFit="cover"
                      fetchPriority={i === 0 ? 'high' : 'auto'}
                      loading={i === 0 ? 'eager' : 'lazy'}
                    />
                  </div>
                )}
                <div className="p-6">
                  <Stack gap="sm">
                    <h3 className="text-xl font-semibold text-brand">{service.title}</h3>
                    <p className="text-muted">{service.description}</p>
                    {service.price != null && service.price !== '' && (
                      <p className="text-base font-medium text-foreground">{service.price}</p>
                    )}
                    {service.subItems != null && service.subItems.length > 0 ? (
                      <ServiceSubItemsAccordion subItems={service.subItems} />
                    ) : null}
                  </Stack>
                </div>
              </article>
            ))}
          </div>
        </section>
      </Container>
    </Section>
  )
}
