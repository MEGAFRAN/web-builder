import type { AdminBookingService, ServiceVariation } from '../types/admin'

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

export function resolveServiceDuration(
  svc: Pick<AdminBookingService, 'durationMinutes' | 'variations'>,
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

export function isServiceRow(x: unknown): x is AdminBookingService {
  if (typeof x !== 'object' || x === null) return false
  const o = x as Record<string, unknown>
  const baseValid =
    typeof o.id === 'string' &&
    typeof o.name === 'string' &&
    typeof o.description === 'string' &&
    typeof o.currency === 'string' &&
    (o.category === undefined || typeof o.category === 'string') &&
    o.id.trim().length > 0 &&
    o.name.trim().length > 0

  if (!baseValid) return false

  const variations = o.variations
  if (Array.isArray(variations) && variations.length > 0) {
    return variations.every(isServiceVariation)
  }

  return (
    typeof o.durationMinutes === 'number' &&
    typeof o.price === 'number' &&
    o.durationMinutes >= 1 &&
    o.durationMinutes <= 24 * 60 &&
    Number.isFinite(o.price) &&
    o.price >= 0
  )
}

export function parseIsoDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s)
}

export function parseHm(hm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hm.trim())
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  if (!Number.isFinite(h) || !Number.isFinite(min) || h > 23 || min > 59) return null
  return h * 60 + min
}

export function isValidDateYmd(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const d = new Date(`${s}T12:00:00`)
  return !Number.isNaN(d.getTime())
}

const DAY_CODES = new Set(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])

export function isWeeklyRow(x: unknown): x is import('../types/admin').WeeklyHoursRow {
  if (typeof x !== 'object' || x === null) return false
  const o = x as Record<string, unknown>
  if (typeof o.day !== 'string' || !DAY_CODES.has(o.day)) return false
  if (typeof o.open !== 'boolean') return false
  if (typeof o.from !== 'string' || typeof o.to !== 'string') return false
  if (o.open) {
    const a = parseHm(o.from)
    const b = parseHm(o.to)
    if (a === null || b === null || b <= a) return false
  }
  return true
}

export const DEFAULT_WEEKLY: import('../types/admin').WeeklyHoursRow[] = [
  { day: 'mon', open: true, from: '09:00', to: '21:00' },
  { day: 'tue', open: true, from: '09:00', to: '21:00' },
  { day: 'wed', open: true, from: '09:00', to: '21:00' },
  { day: 'thu', open: true, from: '09:00', to: '21:00' },
  { day: 'fri', open: true, from: '09:00', to: '21:00' },
  { day: 'sat', open: true, from: '09:00', to: '21:00' },
  { day: 'sun', open: false, from: '09:00', to: '18:00' },
]
