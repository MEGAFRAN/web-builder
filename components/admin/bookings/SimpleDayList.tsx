'use client'

import type { ReservationRow } from '@/types/admin'
import { BookingCard } from './BookingCard'

interface SimpleDayListProps {
  rows: ReservationRow[]
  onSelect: (r: ReservationRow) => void
}

export function SimpleDayList({ rows, onSelect }: SimpleDayListProps) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <p className="mb-3 text-sm text-muted">
        This day is marked closed or uses special hours — appointments are listed below without a
        timeline.
      </p>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id}>
            <BookingCard row={r} variant="list" onClick={() => onSelect(r)} />
          </li>
        ))}
      </ul>
    </div>
  )
}
