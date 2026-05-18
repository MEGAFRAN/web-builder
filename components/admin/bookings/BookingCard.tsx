'use client'

import type { ReservationRow } from '@/types/admin'
import { bookingCardBorderClasses } from '@/lib/booking-utils'
import { reservationStatusAriaEs } from '@/components/admin/admin-locale'

export type BookingCardVariant = 'list' | 'timeline' | 'week'

interface BookingCardProps {
  row: ReservationRow
  onClick: () => void
  variant: BookingCardVariant
  /** Required for the `timeline` variant to display the end time. */
  endLabel?: string
  className?: string
}

export function BookingCard({ row, onClick, variant, endLabel, className = '' }: BookingCardProps) {
  const border = bookingCardBorderClasses(row.status)
  const ariaLabel = buildAriaLabel(row, variant, endLabel)

  if (variant === 'list') {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        className={`flex w-full flex-col rounded-lg bg-surface px-3 py-2 text-left shadow-sm transition focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${border} ${className}`}
      >
        <span className="font-semibold text-foreground">{row.name}</span>
        <span className="text-xs text-muted">
          {row.time} · {row.serviceName ?? 'Servicio'}
        </span>
      </button>
    )
  }

  if (variant === 'timeline') {
    const dimmed = row.status === 'cancelled' || row.status === 'no-show'
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        className={`flex h-full w-full min-h-0 flex-col rounded-lg bg-surface px-3 py-2 text-left shadow-sm transition focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${border} ${dimmed ? 'opacity-60' : ''} ${className}`}
      >
        <span className="truncate text-xs text-muted">
          {row.serviceName ?? 'Servicio'}{' · '}
          {row.time} – {endLabel ?? ''}
        </span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`w-full rounded-md bg-surface px-2 py-1.5 text-left text-xs transition focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${border} ${className}`}
    >
      <div className="font-medium text-foreground">{row.time}</div>
      <div className="truncate text-muted">{row.name}</div>
    </button>
  )
}

function buildAriaLabel(row: ReservationRow, variant: BookingCardVariant, endLabel?: string): string {
  const statusLabel = reservationStatusAriaEs(row.status)
  if (variant === 'list') {
    return `${row.name}, ${row.time}, ${row.serviceName ?? 'Servicio'}, ${statusLabel}`
  }
  if (variant === 'timeline') {
    return `${row.name}, ${row.serviceName ?? 'Servicio'}, ${row.time}–${endLabel ?? ''}, ${statusLabel}`
  }
  return `${row.time}, ${row.name}, ${statusLabel}`
}
