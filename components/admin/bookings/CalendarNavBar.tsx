'use client'

import { addDaysYmd, formatYmd } from '@/lib/booking-utils'

export type CalendarViewMode = 'day' | 'week'

interface CalendarNavBarProps {
  selectedYmd: string
  onSelectedYmdChange: (ymd: string) => void
  view: CalendarViewMode
  onViewChange: (v: CalendarViewMode) => void
}

export function CalendarNavBar({
  selectedYmd,
  onSelectedYmdChange,
  view,
  onViewChange,
}: CalendarNavBarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted-bg focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          onClick={() => onSelectedYmdChange(addDaysYmd(selectedYmd, -1))}
        >
          Anterior
        </button>
        <button
          type="button"
          className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted-bg focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          onClick={() => onSelectedYmdChange(formatYmd(new Date()))}
        >
          Hoy
        </button>
        <button
          type="button"
          className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted-bg focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          onClick={() => onSelectedYmdChange(addDaysYmd(selectedYmd, 1))}
        >
          Siguiente
        </button>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <span className="sr-only">Ir a fecha</span>
          <input
            type="date"
            value={selectedYmd}
            onChange={(e) => onSelectedYmdChange(e.target.value)}
            className="rounded-md border border-border px-2 py-1.5 text-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          />
        </label>
      </div>

      <div
        role="group"
        aria-label="Modo de vista"
        className="inline-flex rounded-md border border-border p-0.5"
      >
        <button
          type="button"
          className={`rounded px-3 py-1.5 text-sm font-medium focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
            view === 'day' ? 'bg-primary text-primary-fg' : 'text-foreground'
          }`}
          onClick={() => onViewChange('day')}
          aria-pressed={view === 'day'}
        >
          Día
        </button>
        <button
          type="button"
          className={`rounded px-3 py-1.5 text-sm font-medium focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
            view === 'week' ? 'bg-primary text-primary-fg' : 'text-foreground'
          }`}
          onClick={() => onViewChange('week')}
          aria-pressed={view === 'week'}
        >
          Semana
        </button>
      </div>
    </div>
  )
}
