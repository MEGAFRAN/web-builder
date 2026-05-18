import { parseYmdLocal } from '@/lib/booking-utils'

/** Pretty date for admin UI (Spanish). */
export function formatPrettyDateEs(ymd: string): string {
  const d = parseYmdLocal(ymd)
  return d.toLocaleDateString('es', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function reservationStatusDisplay(status: string): {
  label: string
  variant: 'error' | 'warning' | 'success'
} {
  if (status === 'cancelled') return { label: 'Cancelada', variant: 'error' }
  if (status === 'no-show') return { label: 'No asistió', variant: 'warning' }
  if (status === 'pending') return { label: 'Pendiente de confirmación', variant: 'warning' }
  return { label: 'Confirmada', variant: 'success' }
}

export function reservationStatusAriaEs(status: string): string {
  if (status === 'cancelled') return 'Cancelada'
  if (status === 'no-show') return 'No asistió'
  if (status === 'pending') return 'Pendiente de confirmación'
  return 'Confirmada'
}
