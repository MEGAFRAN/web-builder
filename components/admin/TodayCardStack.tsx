'use client'

import { useMemo } from 'react'
import { Badge } from '@/components/content/Badge'
import {
  BookingAppointmentActions,
  type BookingAppointmentPatchAction,
} from '@/components/admin/bookings/BookingAppointmentActions'
import {
  adminCopy,
  closedHeadline,
  formatPrettyDateEs,
  reservationStatusDisplay,
} from '@/components/admin/admin-copy'
import { formatListedPrice, resolveServicePrice } from '@/lib/booking-catalog'
import { bookingDurationMinutes, formatYmd, timeToMinutes } from '@/lib/booking-utils'
import type { AdminBookingService, ReservationRow } from '@/types/admin'

export type TodayCardStackPatchAction = BookingAppointmentPatchAction

interface TodayCardStackProps {
  rows: ReservationRow[]
  services: AdminBookingService[]
  /** When true and there are no rows, show the closed-day empty state. */
  closedDay?: boolean
  dateYmd: string
  guaranteeEnabled?: boolean
  onPatchStatus: (id: string, action: TodayCardStackPatchAction) => Promise<void>
  onNoShowCharge?: (id: string) => Promise<void>
  onCreate: () => void
}

function fmtMinutes(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

function formatTimeRange(row: ReservationRow): string {
  const start = timeToMinutes(row.time)
  const end = start + bookingDurationMinutes(row)
  return `${row.time} - ${fmtMinutes(end)}`
}

function resolvePriceForRow(
  row: ReservationRow,
  services: AdminBookingService[],
): { price: number; currency: string } | null {
  if (!row.serviceId) return null
  const svc = services.find((s) => s.id === row.serviceId)
  if (!svc) return null

  if (svc.variations && row.durationMinutes) {
    const match = svc.variations.find((v) => v.durationMinutes === row.durationMinutes)
    if (match) {
      return { price: match.price, currency: svc.currency?.trim() || '€' }
    }
  }

  const price = resolveServicePrice(svc)
  if (price === undefined) return null
  return { price, currency: svc.currency?.trim() || '€' }
}

function formatServiceLine(row: ReservationRow, services: AdminBookingService[]): string {
  const name = row.serviceName ?? adminCopy.common.serviceFallback
  const priced = resolvePriceForRow(row, services)
  if (!priced) return name
  return `${name} - ${formatListedPrice(priced.price, priced.currency)}`
}

function TodayCard({
  row,
  services,
  guaranteeEnabled,
  onPatchStatus,
  onNoShowCharge,
}: {
  row: ReservationRow
  services: AdminBookingService[]
  guaranteeEnabled: boolean
  onPatchStatus: (id: string, action: TodayCardStackPatchAction) => Promise<void>
  onNoShowCharge?: (id: string) => Promise<void>
}) {
  const { label: statusLabel, variant: statusVariant } = reservationStatusDisplay(row.status)
  const phone = row.phone.trim()

  return (
    <article className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-lg font-semibold tabular-nums text-foreground">{formatTimeRange(row)}</p>
        <Badge label={statusLabel} variant={statusVariant} />
      </div>

      <h3 className="mt-3 text-xl font-semibold text-foreground">{row.name}</h3>
      {phone ? (
        <p className="mt-1 text-base text-muted">{phone}</p>
      ) : (
        <p className="mt-1 text-base text-muted">{adminCopy.common.emDash}</p>
      )}

      <p className="mt-3 text-base text-foreground">{formatServiceLine(row, services)}</p>

      <div className="mt-5">
        <BookingAppointmentActions
          row={row}
          layout="inline"
          guaranteeEnabled={guaranteeEnabled}
          onPatchStatus={onPatchStatus}
          onNoShowCharge={onNoShowCharge}
        />
      </div>
    </article>
  )
}

export function TodayCardStack({
  rows,
  services,
  closedDay = false,
  dateYmd,
  guaranteeEnabled = false,
  onPatchStatus,
  onNoShowCharge,
  onCreate,
}: TodayCardStackProps) {
  const dateLabel = formatPrettyDateEs(dateYmd)
  const isTodayHeading = dateYmd === formatYmd(new Date())
  const sortedRows = useMemo(() => {
    const list = [...rows]
    list.sort((a, b) => a.time.localeCompare(b.time))
    return list
  }, [rows])

  if (sortedRows.length === 0) {
    if (closedDay) {
      return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-muted-bg px-6 py-12 text-center">
          <p className="font-medium text-foreground">{closedHeadline(dateLabel)}</p>
          <p className="mt-2 text-sm text-muted">{adminCopy.bookings.closedNoBookings}</p>
          <button
            type="button"
            onClick={onCreate}
            className="mt-6 min-h-11 rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-fg hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            {adminCopy.bookings.newAppointmentButton}
          </button>
        </div>
      )
    }

    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted-bg px-6 py-16 text-center">
        <span className="text-4xl" aria-hidden>
          ☀️
        </span>
        <p className="mt-4 text-lg font-medium text-foreground">
          {adminCopy.bookings.todayStack.emptyToday}
        </p>
        <button
          type="button"
          onClick={onCreate}
          className="mt-6 min-h-11 rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-fg hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          {adminCopy.bookings.newAppointmentButton}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">
        {isTodayHeading ? adminCopy.bookings.todayStack.heading : dateLabel}
      </h2>
      <ul className="space-y-4">
        {sortedRows.map((row) => (
          <li key={row.id}>
            <TodayCard
              row={row}
              services={services}
              guaranteeEnabled={guaranteeEnabled}
              onPatchStatus={onPatchStatus}
              onNoShowCharge={onNoShowCharge}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
