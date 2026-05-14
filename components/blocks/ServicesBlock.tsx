'use client'

import { useState } from 'react'
import type {
  Service,
  ServiceSubItem,
  ServiceSubItemDescription,
  ServiceSubItemPricingRow,
  ServicesBlock as ServicesBlockType,
} from '@/types/cms'
import { Stack } from '@/components/layout/Stack'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { Image } from '@/components/content/Image'
import { Modal } from '@/components/layout/Modal'

function normalizeSubItem(entry: string | ServiceSubItem): ServiceSubItem {
  if (typeof entry === 'string') {
    return { label: entry }
  }
  return entry
}

function pricingRowHasContent(row: ServiceSubItemPricingRow): boolean {
  return (
    (row.price != null && row.price !== '') ||
    (row.duration != null && row.duration !== '') ||
    (row.bookingUrl != null && row.bookingUrl !== '')
  )
}

/** Single-level price/duration/bookingUrl, or multiple `pricingRows` when provided. */
function getSubItemPricingRows(item: ServiceSubItem): ServiceSubItemPricingRow[] {
  const fromArray = (item.pricingRows ?? []).filter(pricingRowHasContent)
  if (fromArray.length > 0) {
    return fromArray
  }
  const hasLegacy =
    (item.price != null && item.price !== '') ||
    (item.duration != null && item.duration !== '') ||
    (item.bookingUrl != null && item.bookingUrl !== '')
  if (hasLegacy) {
    return [
      {
        price: item.price,
        duration: item.duration,
        bookingUrl: item.bookingUrl,
      },
    ]
  }
  return []
}

/** Row URL → sub-item URL → services block `bookingUrl`. */
function resolveSubItemBookingUrl(
  row: ServiceSubItemPricingRow,
  item: ServiceSubItem,
  servicesBlockBookingUrl?: string | null,
): string | null {
  if (row.bookingUrl != null && row.bookingUrl !== '') {
    return row.bookingUrl
  }
  if (item.bookingUrl != null && item.bookingUrl !== '') {
    return item.bookingUrl
  }
  if (servicesBlockBookingUrl != null && servicesBlockBookingUrl !== '') {
    return servicesBlockBookingUrl
  }
  return null
}

function descriptionHasContent(desc: ServiceSubItemDescription | null | undefined): boolean {
  if (desc == null) return false
  if (desc.title.trim() !== '') return true
  const lines = desc.items ?? []
  return lines.some((line) => line.trim() !== '')
}

function subItemHasExpandableDetails(item: ServiceSubItem): boolean {
  const { description } = item
  return Boolean(
    getSubItemPricingRows(item).length > 0 || descriptionHasContent(description),
  )
}

function SubItemDetailsBody({
  item,
  servicesBlockBookingUrl,
}: {
  item: ServiceSubItem
  servicesBlockBookingUrl?: string | null
}) {
  const rows = getSubItemPricingRows(item)
  const { description } = item
  if (!subItemHasExpandableDetails(item)) return null

  return (
    <div className="space-y-2 text-sm text-muted">
      {rows.map((row, idx) => (
        <div
          key={idx}
          className="space-y-2 rounded-md px-2 py-1.5 outline outline-1 outline-offset-0 [outline-color:color-mix(in_srgb,var(--color-text)_15%,transparent)]"
        >
          {row.duration != null && row.duration !== '' ? (
            <p>
              <span className="sr-only">Duration </span>
              {row.duration}
            </p>
          ) : null}
          {row.price != null && row.price !== '' ? (
            <p>
              <span className="sr-only">Price </span>
              <span className="font-medium text-foreground">{row.price}</span>
            </p>
          ) : null}
          {(() => {
            const url = resolveSubItemBookingUrl(row, item, servicesBlockBookingUrl)
            return url != null ? (
              <p>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  Reservar
                </a>
              </p>
            ) : null
          })()}
        </div>
      ))}
      {description != null && descriptionHasContent(description) ? (
        <div className="space-y-2">
          {description.title.trim() !== '' ? (
            <p>
              <span className="sr-only">Description </span>
              {description.title}
            </p>
          ) : null}
          {(description.items ?? []).some((l) => l.trim() !== '') ? (
            <ul className="list-disc space-y-1 pl-5" role="list">
              {(description.items ?? [])
                .filter((l) => l.trim() !== '')
                .map((line, k) => (
                  <li key={k}>{line}</li>
                ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function ServiceSubItemsAccordion({
  subItems,
  fallbackBookingUrl,
}: {
  subItems: NonNullable<Service['subItems']>
  fallbackBookingUrl?: string | null
}) {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="divide-y divide-border border-t border-border pt-3" role="list">
      {subItems.map((raw, j) => {
        const item = normalizeSubItem(raw)
        const { label } = item
        const hasDetails = subItemHasExpandableDetails(item)

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
              <div className="mt-3">
                <SubItemDetailsBody
                  item={item}
                  servicesBlockBookingUrl={fallbackBookingUrl}
                />
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

function ServiceSubItemsModalList({
  subItems,
  fallbackBookingUrl,
  moreInfoLabel,
}: {
  subItems: NonNullable<Service['subItems']>
  fallbackBookingUrl?: string | null
  moreInfoLabel?: string | null
}) {
  const [activeItem, setActiveItem] = useState<ServiceSubItem | null>(null)

  return (
    <>
      <div className="divide-y divide-border border-t border-border pt-3" role="list">
        {subItems.map((raw, j) => {
          const item = normalizeSubItem(raw)
          const { label } = item
          const rows = getSubItemPricingRows(item)
          const hasModalContent = descriptionHasContent(item.description)

          return (
            <div key={j} className="py-3 first:pt-0 last:pb-0" role="listitem">
              <div className="min-w-0 space-y-2">
                <p className="text-sm font-bold text-foreground">{label}</p>
                {hasModalContent ? (
                  <button
                    type="button"
                    onClick={() => setActiveItem(item)}
                    className="block text-xs text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
                    aria-haspopup="dialog"
                    aria-label={`${moreInfoLabel ?? 'Más información'} sobre ${label}`}
                  >
                    {moreInfoLabel ?? 'Más información'}
                  </button>
                ) : null}
                {rows.map((row, rIdx) => {
                  const url = resolveSubItemBookingUrl(row, item, fallbackBookingUrl)
                  return (
                    <div
                      key={rIdx}
                      className={
                        rIdx > 0
                          ? 'flex w-full flex-wrap items-center justify-end gap-x-3 gap-y-1 border-t border-border pt-2'
                          : 'flex w-full flex-wrap items-center justify-end gap-x-3 gap-y-1'
                      }
                    >
                      {row.duration != null && row.duration !== '' ? (
                        <span className="text-xs text-muted">
                          <span className="sr-only">Duration </span>
                          {row.duration}
                        </span>
                      ) : null}
                      {row.price != null && row.price !== '' ? (
                        <span className="text-sm font-medium text-foreground">
                          <span className="sr-only">Price </span>
                          {row.price}
                        </span>
                      ) : null}
                      {url != null ? (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex shrink-0 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                        >
                          Reservar
                        </a>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
      <Modal
        isOpen={activeItem != null}
        onClose={() => setActiveItem(null)}
        title={activeItem?.label}
      >
        {activeItem ? (
          <SubItemDetailsBody
            item={activeItem}
            servicesBlockBookingUrl={fallbackBookingUrl}
          />
        ) : null}
      </Modal>
    </>
  )
}

export default function ServicesBlock({
  heading,
  items,
  showModal,
  moreInfoLabel,
  bookingUrl,
}: ServicesBlockType) {
  const useModal = Boolean(showModal)

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
                      useModal ? (
                        <ServiceSubItemsModalList subItems={service.subItems} fallbackBookingUrl={bookingUrl} moreInfoLabel={moreInfoLabel} />
                      ) : (
                        <ServiceSubItemsAccordion
                          subItems={service.subItems}
                          fallbackBookingUrl={bookingUrl}
                        />
                      )
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
