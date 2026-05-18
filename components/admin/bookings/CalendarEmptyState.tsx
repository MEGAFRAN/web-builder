'use client'

interface CalendarEmptyStateProps {
  variant: 'empty' | 'closed'
  /** Required for the `closed` variant — shown as "Closed · {dateLabel}". */
  dateLabel?: string
  onCreate: () => void
}

export function CalendarEmptyState({ variant, dateLabel, onCreate }: CalendarEmptyStateProps) {
  if (variant === 'closed') {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-muted-bg px-6 py-12 text-center">
        <p className="font-medium text-foreground">Closed · {dateLabel}</p>
        <p className="mt-2 text-sm text-muted">No bookings are accepted on this date.</p>
        <button
          type="button"
          onClick={onCreate}
          className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-fg hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          + New appointment
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted-bg px-6 py-16 text-center">
      <span className="text-4xl" aria-hidden>
        📋
      </span>
      <p className="mt-4 text-foreground">No appointments for this day</p>
      <button
        type="button"
        onClick={onCreate}
        className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-fg hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
      >
        + New appointment
      </button>
    </div>
  )
}
