'use client'

import { Badge } from '@/components/content/Badge'
import { bookingDurationMinutes, timeToMinutes } from '@/lib/booking-utils'
import { adminCopy, formatPrettyDateEs, reservationStatusDisplay } from '@/components/admin/admin-copy'
import type { ReservationRow } from '@/types/admin'

interface BookingDetailDrawerProps {
  row: ReservationRow
  onClose: () => void
  onCancel: () => void
  onNoShow: () => void
}

function fmt(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

export function BookingDetailDrawer({ row, onClose, onCancel, onNoShow }: BookingDetailDrawerProps) {
  const dur = bookingDurationMinutes(row)
  const start = timeToMinutes(row.time)
  const endMin = start + dur
  const { label: stLabel, variant } = reservationStatusDisplay(row.status)

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/30"
        aria-label={adminCopy.common.closePanel}
        onClick={onClose}
      />
      <aside
        className="relative z-10 flex h-full w-full max-w-md flex-col border-border border-l bg-background shadow-xl"
        tabIndex={-1}
      >
        <div className="flex items-center justify-between border-border border-b px-4 py-3">
          <h2 className="text-lg font-semibold text-foreground">{adminCopy.bookings.appointment}</h2>
          <button
            type="button"
            className="rounded-md p-2 hover:bg-muted-bg focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            onClick={onClose}
          >
            {adminCopy.common.close}
          </button>
        </div>
        <div className="flex-1 overflow-auto px-4 py-4">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="font-medium text-muted">{adminCopy.drawer.client}</dt>
              <dd className="text-foreground">{row.name}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted">{adminCopy.drawer.phone}</dt>
              <dd className="text-foreground">{row.phone}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted">{adminCopy.drawer.email}</dt>
              <dd className="text-foreground">{row.email}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted">{adminCopy.drawer.service}</dt>
              <dd className="text-foreground">
                {row.serviceName ?? row.serviceId ?? adminCopy.common.emDash}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-muted">{adminCopy.drawer.duration}</dt>
              <dd className="text-foreground">
                {dur} {adminCopy.common.minutes}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-muted">{adminCopy.drawer.when}</dt>
              <dd className="text-foreground">
                {formatPrettyDateEs(row.date)} · {fmt(start)} – {fmt(endMin)}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-muted">{adminCopy.drawer.notes}</dt>
              <dd className="text-foreground">
                {row.notes?.trim() ? row.notes : adminCopy.common.emDash}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-muted">{adminCopy.drawer.status}</dt>
              <dd>
                <Badge label={stLabel} variant={variant} />
              </dd>
            </div>
          </dl>

          <div className="mt-8 flex flex-col gap-2">
            <button
              type="button"
              disabled={row.status === 'cancelled'}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted-bg disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              onClick={onCancel}
            >
              {adminCopy.bookings.cancelAppointment}
            </button>
            <button
              type="button"
              disabled={row.status === 'no-show' || row.status === 'cancelled'}
              className="rounded-md bg-yellow-100 px-4 py-2 text-sm font-medium text-yellow-900 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              onClick={onNoShow}
            >
              {adminCopy.bookings.markNoShow}
            </button>
          </div>
        </div>
      </aside>
    </div>
  )
}
