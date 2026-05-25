import type { ReservationServiceItem, Service, ServiceVariation } from '@/types/cms'

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

export function hasServiceVariations(
  svc: { variations?: ServiceVariation[] | null },
): boolean {
  return (svc.variations?.length ?? 0) > 0
}

export function isServiceVariation(x: unknown): x is ServiceVariation {
  if (typeof x !== 'object' || x === null) return false
  const o = x as Record<string, unknown>
  return (
    typeof o.id === 'string' &&
    o.id.trim().length > 0 &&
    typeof o.durationMinutes === 'number' &&
    o.durationMinutes >= 1 &&
    o.durationMinutes <= 24 * 60 &&
    typeof o.price === 'number' &&
    Number.isFinite(o.price) &&
    o.price >= 0 &&
    (o.label === undefined || typeof o.label === 'string')
  )
}

function parseServiceVariations(raw: unknown): ServiceVariation[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined
  const out: ServiceVariation[] = []
  for (const item of raw) {
    if (!isServiceVariation(item)) return undefined
    out.push({
      id: item.id.trim(),
      ...(typeof item.label === 'string' && item.label.trim().length > 0
        ? { label: item.label.trim() }
        : {}),
      durationMinutes: item.durationMinutes,
      price: item.price,
    })
  }
  return out.length > 0 ? out : undefined
}

export function resolveServiceDuration(
  svc: Pick<ReservationServiceItem, 'durationMinutes' | 'variations'>,
  variationId?: string | null,
): number | undefined {
  if (variationId && svc.variations) {
    const match = svc.variations.find((v) => v.id === variationId)
    if (match) return match.durationMinutes
  }
  if (hasServiceVariations(svc)) {
    return svc.variations![0]?.durationMinutes
  }
  return svc.durationMinutes
}

export function resolveServicePrice(
  svc: Pick<ReservationServiceItem, 'price' | 'variations'>,
  variationId?: string | null,
): number | undefined {
  if (variationId && svc.variations) {
    const match = svc.variations.find((v) => v.id === variationId)
    if (match) return match.price
  }
  if (hasServiceVariations(svc)) {
    return svc.variations![0]?.price
  }
  return svc.price
}

export function formatAdminVariationSummary(
  variations: ServiceVariation[],
  currency: string,
): string {
  return variations
    .map((v) => {
      const price = formatListedPrice(v.price, currency)
      const duration = `${v.durationMinutes} min`
      const label = v.label?.trim()
      return label ? `${label}: ${duration} (${price})` : `${duration} (${price})`
    })
    .join(' · ')
}

export function formatCatalogServicePriceLabel(svc: ReservationServiceItem): string {
  const currency = svc.currency?.trim() || '€'
  if (hasServiceVariations(svc)) {
    const vars = svc.variations!
    const minPrice = Math.min(...vars.map((v) => v.price))
    const minDur = Math.min(...vars.map((v) => v.durationMinutes))
    const maxDur = Math.max(...vars.map((v) => v.durationMinutes))
    const pricePart = `Desde ${formatListedPrice(minPrice, currency)}`
    const durPart = minDur === maxDur ? `${minDur} min` : `${minDur}-${maxDur} min`
    return `${pricePart} · ${durPart}`
  }
  if (svc.durationMinutes != null && svc.price != null) {
    return `${svc.durationMinutes} min · ${formatListedPrice(svc.price, currency)}`
  }
  return ''
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
    if (typeof id !== 'string' || id.trim().length === 0 || typeof name !== 'string' || name.trim().length === 0) {
      continue
    }

    const variations = parseServiceVariations(o.variations)
    const durationMinutes = o.durationMinutes
    const price = o.price

    if (variations) {
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
        currency,
        variations,
        ...(category ? { category } : {}),
      })
      continue
    }

    if (
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
  const category = svc.category?.trim()
  return {
    title: svc.name,
    description: svc.description?.trim() ?? '',
    price: formatCatalogServicePriceLabel(svc),
    bookingServiceId: svc.id,
    ...(category ? { category } : {}),
  }
}

export function mapBookingServicesToCmsServices(services: ReservationServiceItem[]): Service[] {
  return services.map(mapBookingServiceToCmsService)
}
