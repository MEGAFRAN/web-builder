import type { ReservationServiceItem, Service } from '@/types/cms'

export type ServiceCategoryGroup<T extends { category?: string | null }> = {
  category: string
  items: T[]
}

/** Preserves list order; first appearance of each category defines group order. */
export function groupServicesByCategory<T extends { category?: string | null }>(
  items: T[],
): ServiceCategoryGroup<T>[] {
  const groups: ServiceCategoryGroup<T>[] = []
  const indexByCategory = new Map<string, number>()

  for (const item of items) {
    const category = item.category?.trim() ?? ''
    let ix = indexByCategory.get(category)
    if (ix === undefined) {
      ix = groups.length
      indexByCategory.set(category, ix)
      groups.push({ category, items: [] })
    }
    groups[ix].items.push(item)
  }

  return groups
}

export function hasServiceCategories(items: Array<{ category?: string | null }>): boolean {
  return items.some((item) => (item.category?.trim() ?? '') !== '')
}

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
    let category: string | null | undefined
    if (typeof o.category === 'string') category = o.category.trim() || null
    else if (o.category === null || o.category === undefined) category = undefined
    out.push({
      id: id.trim(),
      name: name.trim(),
      description,
      durationMinutes,
      price,
      currency,
      ...(category ? { category } : {}),
    })
  }
  return out
}

export function mapBookingServiceToCmsService(svc: ReservationServiceItem): Service {
  const currency = svc.currency?.trim() || '€'
  const priceLabel = formatListedPrice(svc.price, currency)
  const category = svc.category?.trim()
  return {
    title: svc.name,
    description: svc.description?.trim() ?? '',
    price: `${svc.durationMinutes} min · ${priceLabel}`,
    bookingServiceId: svc.id,
    ...(category ? { category } : {}),
  }
}

export function mapBookingServicesToCmsServices(services: ReservationServiceItem[]): Service[] {
  return services.map(mapBookingServiceToCmsService)
}
