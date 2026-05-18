'use client'

import type { ReservationRow } from '@/types/admin'
import { addDaysYmd } from '@/lib/booking-utils'
import { BookingCard } from './BookingCard'
import { WEEK_SHORT_LABELS, weekDayHeader } from '@/components/admin/admin-copy'

interface WeekGridProps {
  weekStart: string
  rows: ReservationRow[]
  onPickDay: (ymd: string) => void
  onSelect: (r: ReservationRow) => void
}

export function WeekGrid({ weekStart, rows, onPickDay, onSelect }: WeekGridProps) {
  const days = [...Array(7)].map((_, i) => addDaysYmd(weekStart, i))

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-7">
      {days.map((ymd, i) => {
        const dayRows = rows
          .filter((r) => r.date === ymd)
          .sort((a, b) => a.time.localeCompare(b.time))
        return (
          <div
            key={ymd}
            className="flex min-h-[220px] flex-col rounded-xl border border-border bg-background"
          >
            <button
              type="button"
              onClick={() => onPickDay(ymd)}
              className="border-border border-b px-3 py-2 text-left text-sm font-semibold hover:bg-muted-bg focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              {weekDayHeader(WEEK_SHORT_LABELS[i], ymd.slice(8))}
            </button>
            <ul className="flex flex-1 flex-col gap-1 p-2">
              {dayRows.map((r) => (
                <li key={r.id}>
                  <BookingCard row={r} variant="week" onClick={() => onSelect(r)} />
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
