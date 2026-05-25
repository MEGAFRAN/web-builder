import type { ReservationServiceItem, Service } from '@/types/cms'

export function formatListedPrice(price: number, currencySymbol: string): string {
  const text = Number.isInteger(price)
    ? String(price)
    : price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return `${currencySymbol}${text}`
}

/** Accepts rows persisted by `/api/admin/services` (same file as the public catalog). */
export function parseBookingCatalogRows(raw: unknown): ReservationServiceItem[] {
  if (!Array.isArray(raw)) return []
  const out: ReservationServiceItem[] = []
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) continue
    const o = item as Record<string, unknown>
    const id = o.id
    const name = o.name
    const durationMinutes = o.durationMinutes
    const price = o.price
    if (
      typeof id !== 'string' ||
      id.trim().length === 0 ||
      typeof name !== 'string' ||
      name.trim().length === 0 ||
      typeof durationMinutes !== 'number' ||
      durationMinutes < 1 ||
      durationMinutes > 24 * 60 ||
      typeof price !== 'number' ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      continue
    }
    let description: string | null | undefined
    if (typeof o.description === 'string') description = o.description
    else if (o.description === null || o.description === undefined) description = undefined
    const currencyRaw = o.currency
    const currency =
      typeof currencyRaw === 'string' && currencyRaw.trim().length > 0 ? currencyRaw.trim() : null
    out.push({
      id: id.trim(),
      name: name.trim(),
      description,
      durationMinutes,
      price,
      currency,
    })
  }
  return out
}

export function mapBookingServiceToCmsService(svc: ReservationServiceItem): Service {
  const currency = svc.currency?.trim() || '€'
  const priceLabel = formatListedPrice(svc.price, currency)
  return {
    title: svc.name,
    description: svc.description?.trim() ?? '',
    price: `${svc.durationMinutes} min · ${priceLabel}`,
    bookingServiceId: svc.id,
  }
}

export function mapBookingServicesToCmsServices(services: ReservationServiceItem[]): Service[] {
  return services.map(mapBookingServiceToCmsService)
}
