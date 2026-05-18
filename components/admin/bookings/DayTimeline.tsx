'use client'

import type { ReservationRow } from '@/types/admin'
import { bookingDurationMinutes, timeToMinutes } from '@/lib/booking-utils'
import { BookingCard } from './BookingCard'

interface DayTimelineProps {
  rows: ReservationRow[]
  openMin: number
  closeMin: number
  ppm: number
  timelineHeight: number
  onSelect: (r: ReservationRow) => void
}

function fmtMin(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

export function DayTimeline({
  rows,
  openMin,
  closeMin,
  ppm,
  timelineHeight,
  onSelect,
}: DayTimelineProps) {
  const ticks: number[] = []
  for (let m = openMin; m <= closeMin; m += 60) {
    ticks.push(m)
  }

  return (
    <div className="relative overflow-x-auto rounded-xl border border-border bg-background">
      <div className="relative" style={{ minHeight: timelineHeight }}>
        <div className="absolute top-0 bottom-0 left-14 border-border border-l" aria-hidden />
        {ticks.map((m) => {
          const top = (m - openMin) * ppm
          return (
            <div
              key={m}
              className="pointer-events-none absolute right-0 left-14 border-border border-t border-dashed text-[11px] text-muted"
              style={{ top }}
            >
              <span className="absolute -top-2 -left-12 w-10 text-right">{fmtMin(m)}</span>
            </div>
          )
        })}

        <ol className="absolute top-0 right-2 bottom-0 left-16 list-none space-y-1 p-2">
          {rows.map((r) => {
            const start = timeToMinutes(r.time)
            const dur = bookingDurationMinutes(r)
            const top = (start - openMin) * ppm
            const height = Math.max(dur * ppm, 36)
            const endMin = start + dur
            const endLabel = fmtMin(endMin)
            return (
              <li
                key={r.id}
                className="absolute right-1 left-1 list-none"
                style={{ top, height }}
              >
                <BookingCard
                  row={r}
                  variant="timeline"
                  endLabel={endLabel}
                  onClick={() => onSelect(r)}
                />
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
