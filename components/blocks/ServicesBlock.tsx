'use client'

import { useState } from 'react'
import { mapBookingServicesToCmsServices } from '@/lib/booking-catalog'
import { useBookingServicesCatalog } from '@/lib/hooks/useBookingServicesCatalog'
import { Button } from '@/components/inputs/Button'
import ReservationBlock from '@/components/blocks/ReservationBlock'
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

function subItemImageHasContent(item: ServiceSubItem): boolean {
  const u = item.imageUrl
  return u != null && u.trim() !== ''
}

function subItemHasExpandableDetails(item: ServiceSubItem): boolean {
  return Boolean(
    getSubItemPricingRows(item).length > 0 ||
      descriptionHasContent(item.description) ||
      subItemImageHasContent(item),
  )
}

function serviceHasInfoModalContent(service: Service): boolean {
  return Boolean(
    service.description.trim() !== '' ||
    (service.imageUrl != null && service.imageUrl !== '') ||
    (service.price != null && service.price !== '') ||
    service.bookingServiceId != null ||
    (service.subItems != null && service.subItems.length > 0),
  )
}

function ServiceInfoModalBody({
  service,
  bookCtaLabel,
  onBook,
}: {
  service: Service
  bookCtaLabel: string
  onBook: () => void
}) {
  const hasImage = service.imageUrl != null && service.imageUrl !== ''
  const hasDescription = service.description.trim() !== ''
  const hasPrice = service.price != null && service.price !== ''
  const hasBook = service.bookingServiceId != null

  const imageSection = hasImage ? (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl">
      <Image
        src={service.imageUrl!.trim()}
        alt={(service.imageAlt != null && service.imageAlt.trim() !== '' ? service.imageAlt : service.title).trim()}
        fill
        objectFit="cover"
        loading="lazy"
      />
    </div>
  ) : null

  const descriptionSection = hasDescription ? (
    <p className="text-sm text-muted">{service.description}</p>
  ) : null

  const pricingSection =
    hasPrice || hasBook ? (
      <div
        className={
          hasPrice && hasBook
            ? 'flex w-full flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-md px-2 py-1.5 outline outline-1 outline-offset-0 [outline-color:color-mix(in_srgb,var(--color-text)_15%,transparent)]'
            : 'flex w-full flex-wrap items-center justify-end gap-x-3 gap-y-2 rounded-md px-2 py-1.5 outline outline-1 outline-offset-0 [outline-color:color-mix(in_srgb,var(--color-text)_15%,transparent)]'
        }
      >
        {hasPrice ? (
          <span className="min-w-0 text-base font-medium text-foreground">{service.price}</span>
        ) : null}
        {hasBook ? (
          <Button label={bookCtaLabel} variant="primary" size="md" onClick={onBook} />
        ) : null}
      </div>
    ) : null

  const usePinnedFooterLayout =
    pricingSection != null && (descriptionSection != null || imageSection != null)

  if (usePinnedFooterLayout) {
    return (
      <div className="flex flex-col gap-4 md:gap-6">
        {imageSection}
        <div className="text-sm text-muted">
          <div className="flex min-h-[min(calc(100dvh-7rem),34rem)] flex-col gap-6 pb-[calc(100px+5.5rem)] md:min-h-0 md:pb-[calc(100px+4.5rem)]">
            {descriptionSection != null ? (
              <div className="min-h-0 flex-1">{descriptionSection}</div>
            ) : imageSection != null ? (
              <div className="min-h-0 flex-1" aria-hidden />
            ) : null}
            <div className="sticky bottom-[100px] z-[11] shrink-0 border-t border-border bg-background/95 pt-3 supports-[backdrop-filter]:bg-background/80 supports-[backdrop-filter]:backdrop-blur-sm">
              {pricingSection}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {imageSection}
      {descriptionSection}
      {pricingSection}
    </div>
  )
}

function SubItemDetailsBody({
  item,
  servicesBlockBookingUrl,
  pinPricingToModalBottom,
}: {
  item: ServiceSubItem
  servicesBlockBookingUrl?: string | null
  /** Push duration/price/CTA toward the modal footer on short viewport (mobile full-screen modal). */
  pinPricingToModalBottom?: boolean
}) {
  const rows = getSubItemPricingRows(item)
  const { description } = item
  if (!subItemHasExpandableDetails(item)) return null

  const imageSection =
    subItemImageHasContent(item) && item.imageUrl != null ? (
      <div className="relative aspect-video w-full overflow-hidden rounded-xl">
        <Image
          src={item.imageUrl.trim()}
          alt={(item.imageAlt != null && item.imageAlt.trim() !== '' ? item.imageAlt : item.label).trim()}
          fill
          objectFit="cover"
          loading="lazy"
        />
      </div>
    ) : null

  const descriptionSection =
    description != null && descriptionHasContent(description) ? (
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
    ) : null

  const pricingSection =
    rows.length > 0 ? (
      <div className="space-y-2">
        {rows.map((row, idx) => (
          <div
            key={idx}
            className="flex w-full flex-wrap items-center justify-end gap-x-3 gap-y-1 rounded-md px-2 py-1.5 outline outline-1 outline-offset-0 [outline-color:color-mix(in_srgb,var(--color-text)_15%,transparent)]"
          >
            {row.duration != null && row.duration !== '' ? (
              <span className="shrink-0">
                <span className="sr-only">Duration </span>
                {row.duration}
              </span>
            ) : null}
            {row.price != null && row.price !== '' ? (
              <span className="shrink-0 font-medium text-foreground">
                <span className="sr-only">Price </span>
                {row.price}
              </span>
            ) : null}
            {(() => {
              const url = resolveSubItemBookingUrl(row, item, servicesBlockBookingUrl)
              return url != null ? (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  Reservar
                </a>
              ) : null
            })()}
          </div>
        ))}
      </div>
    ) : null

  const detailsBlock =
    descriptionSection != null || pricingSection != null ? (
      <div className="space-y-2 text-sm text-muted">
        {descriptionSection}
        {pricingSection}
      </div>
    ) : null

  const usePinnedFooterLayout =
    pinPricingToModalBottom &&
    pricingSection != null &&
    (descriptionSection != null || imageSection != null)

  if (usePinnedFooterLayout) {
    return (
      <div className="flex flex-col gap-4 md:gap-6">
        {imageSection}
        <div className="text-sm text-muted">
          <div className="flex min-h-[min(calc(100dvh-7rem),34rem)] flex-col gap-6 pb-[calc(100px+5.5rem)] md:min-h-0 md:pb-[calc(100px+4.5rem)]">
            {descriptionSection != null ? (
              <div className="min-h-0 flex-1">{descriptionSection}</div>
            ) : imageSection != null ? (
              <div className="min-h-0 flex-1" aria-hidden />
            ) : null}
            <div className="sticky bottom-[100px] z-[11] shrink-0 border-t border-border bg-background/95 pt-3 supports-[backdrop-filter]:bg-background/80 supports-[backdrop-filter]:backdrop-blur-sm">
              {pricingSection}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {imageSection}
      {detailsBlock}
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
          const hasModalContent =
            descriptionHasContent(item.description) || subItemImageHasContent(item)

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
                          className="inline-flex shrink-0 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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
            pinPricingToModalBottom
          />
        ) : null}
      </Modal>
    </>
  )
}

function getSubItemSummary(item: ServiceSubItem): string | null {
  const lines = item.description?.items ?? []
  const line = lines.find((entry) => entry.trim() !== '')
  return line?.trim() ?? null
}

function MenuLayout({
  heading,
  items,
}: {
  heading?: string | null
  items: Service[]
}) {
  return (
    <Section paddingY="lg">
      <Container maxWidth="2xl" padding="theme">
        <section data-component="services-block" data-layout="menu">
          <Stack gap="xl">
            {heading != null && heading !== '' && (
              <h2 className="text-center text-4xl font-bold tracking-tight text-brand">
                {heading}
              </h2>
            )}
            {items.map((service, i) => (
              <div key={i}>
                <h2 className="text-3xl font-bold tracking-tight text-brand">
                  {service.title}
                </h2>
                {service.imageUrl != null && service.imageUrl !== '' && (
                  <div className="relative mt-4 aspect-[16/9] w-full overflow-hidden rounded-[var(--radius)]">
                    <Image
                      src={service.imageUrl}
                      fill
                      objectFit="cover"
                      alt={service.title}
                    />
                  </div>
                )}
                <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 items-stretch">
                  {(service.subItems ?? []).map((raw, j) => {
                    const item = normalizeSubItem(raw)
                    const rows = getSubItemPricingRows(item)
                    const price = rows[0]?.price ?? item.price
                    const summary = getSubItemSummary(item)

                    return (
                      <article
                        key={j}
                        className="flex flex-col h-full rounded-[var(--radius)] bg-surface shadow-sm p-5"
                      >
                        <div className="min-h-[3.5rem]">
                          <h3 className="text-lg font-semibold text-foreground">
                            {item.label}
                          </h3>
                        </div>
                        {summary ? (
                          <p className="mt-2 text-base text-muted">{summary}</p>
                        ) : null}
                        {price != null && price !== '' ? (
                          <p className="mt-auto text-right text-sm font-medium text-foreground">
                            {price}
                          </p>
                        ) : null}
                      </article>
                    )
                  })}
                </div>
              </div>
            ))}
          </Stack>
        </section>
      </Container>
    </Section>
  )
}

export default function ServicesBlock({
  heading,
  items,
  layout,
  showModal,
  moreInfoLabel,
  bookingUrl,
  clientId,
  bookCtaLabel,
  reservationConfirmationMessage,
}: ServicesBlockType) {
  const cmsItems = items ?? []
  const { liveCatalog, catalogLoaded } = useBookingServicesCatalog(clientId)
  const adminPreferred =
    catalogLoaded && liveCatalog !== null && liveCatalog.length > 0
      ? mapBookingServicesToCmsServices(liveCatalog)
      : null
  const displayItems = adminPreferred ?? cmsItems
  const useModal = Boolean(showModal)
  const resolvedBookCtaLabel = bookCtaLabel?.trim() || 'Reservar'
  const resolvedMoreInfoLabel = moreInfoLabel?.trim() || 'Más información'
  const resolvedClientId = clientId ?? process.env.CLIENT_ID ?? null
  const [bookingServiceId, setBookingServiceId] = useState<string | null>(null)
  const [infoService, setInfoService] = useState<Service | null>(null)
  const bookingServiceName =
    bookingServiceId != null
      ? displayItems.find(item => item.bookingServiceId === bookingServiceId)?.title
      : undefined

  if (layout === 'menu') {
    return <MenuLayout heading={heading} items={displayItems} />
  }

  return (
    <>
      <Section paddingY="lg">
        <Container maxWidth="2xl" padding="theme">
          <section data-component="services-block" id="services">
            <div className="flex flex-col gap-8">
              {heading != null && heading !== '' && (
                <h2 className="text-center text-3xl font-bold text-foreground">{heading}</h2>
              )}
              {displayItems.map((service, i) => (
                <article key={service.bookingServiceId ?? i} className="overflow-hidden rounded-lg border border-border">
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
                      {service.description !== '' ? (
                        <p className="line-clamp-2 overflow-hidden text-muted">{service.description}</p>
                      ) : null}
                      {(service.price != null && service.price !== '') || service.bookingServiceId ? (
                        <div
                          className={
                            service.price != null &&
                            service.price !== '' &&
                            service.bookingServiceId
                              ? 'flex flex-wrap items-center justify-between gap-x-3 gap-y-2'
                              : 'flex flex-wrap items-center justify-end gap-x-3 gap-y-2'
                          }
                        >
                          {service.price != null && service.price !== '' ? (
                            <p className="min-w-0 text-base font-medium text-foreground">
                              {service.price}
                            </p>
                          ) : null}
                          {service.bookingServiceId ? (
                            <Button
                              label={resolvedBookCtaLabel}
                              variant="primary"
                              size="md"
                              onClick={() => setBookingServiceId(service.bookingServiceId ?? null)}
                            />
                          ) : null}
                        </div>
                      ) : null}
                      {serviceHasInfoModalContent(service) ? (
                        <button
                          type="button"
                          onClick={() => setInfoService(service)}
                          className="self-start text-xs text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
                          aria-haspopup="dialog"
                          aria-label={`${resolvedMoreInfoLabel} sobre ${service.title}`}
                        >
                          {resolvedMoreInfoLabel}
                        </button>
                      ) : null}
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

      <Modal
        isOpen={infoService != null}
        onClose={() => setInfoService(null)}
        title={infoService?.title}
      >
        {infoService ? (
          <ServiceInfoModalBody
            service={infoService}
            bookCtaLabel={resolvedBookCtaLabel}
            onBook={() => {
              const serviceId = infoService.bookingServiceId
              setInfoService(null)
              if (serviceId != null) {
                setBookingServiceId(serviceId)
              }
            }}
          />
        ) : null}
      </Modal>

      <Modal
        isOpen={bookingServiceId != null}
        onClose={() => setBookingServiceId(null)}
        title={bookingServiceName ?? resolvedBookCtaLabel}
        size="wide"
      >
        {bookingServiceId != null ? (
          <ReservationBlock
            _type="reservationBlock"
            clientId={resolvedClientId}
            confirmationMessage={reservationConfirmationMessage}
            initialServiceId={bookingServiceId}
            skipServiceSelection
            embedded
            hideHeading
          />
        ) : null}
      </Modal>
    </>
  )
}
