import type { ReservationRow } from '@/types/admin'

export function formatYmd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseYmdLocal(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

export function addDaysYmd(ymd: string, delta: number): string {
  const d = parseYmdLocal(ymd)
  d.setDate(d.getDate() + delta)
  return formatYmd(d)
}

export function mondayOfWeek(ymd: string): string {
  const d = parseYmdLocal(ymd)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return formatYmd(d)
}

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

export function bookingDurationMinutes(r: ReservationRow): number {
  if (typeof r.durationMinutes === 'number' && r.durationMinutes > 0) {
    return r.durationMinutes
  }
  return 60
}

export function formatPrettyDate(ymd: string): string {
  const d = parseYmdLocal(ymd)
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function statusBadge(status: string): { label: string; variant: string } {
  if (status === 'cancelled') return { label: 'Cancelled', variant: 'error' }
  if (status === 'no-show') return { label: 'No-show', variant: 'warning' }
  if (status === 'pending') return { label: 'To be confirmed', variant: 'warning' }
  return { label: 'Confirmed', variant: 'success' }
}

export function bookingCardBorderClasses(status: string): string {
  if (status === 'cancelled' || status === 'no-show') {
    return 'border border-border hover:border-primary'
  }
  if (status === 'pending') {
    return 'border-2 border-yellow-500 hover:border-yellow-600'
  }
  return 'border-2 border-green-600 hover:border-green-700'
}

export function bookingStatusAriaLabel(status: string): string {
  if (status === 'cancelled') return 'Cancelled'
  if (status === 'no-show') return 'No-show'
  if (status === 'pending') return 'To be confirmed'
  return 'Confirmed'
}
