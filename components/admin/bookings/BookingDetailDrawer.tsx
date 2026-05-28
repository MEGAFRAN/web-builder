'use client'

import { Badge } from '@/components/content/Badge'
import {
  BookingAppointmentActions,
  type BookingAppointmentPatchAction,
} from '@/components/admin/bookings/BookingAppointmentActions'
import { bookingDurationMinutes, timeToMinutes } from '@/lib/booking-utils'
import { adminCopy, formatPrettyDateEs, reservationStatusDisplay } from '@/components/admin/admin-copy'
import type { ReservationRow } from '@/types/admin'

interface BookingDetailDrawerProps {
  row: ReservationRow
  onClose: () => void
  onCancel: () => void
  onPatchStatus: (id: string, action: BookingAppointmentPatchAction) => Promise<void>
  onNoShowCharge?: (id: string) => Promise<void>
  guaranteeEnabled?: boolean
}

function fmt(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

export function BookingDetailDrawer({
  row,
  onClose,
  onCancel,
  onPatchStatus,
  onNoShowCharge,
  guaranteeEnabled = false,
}: BookingDetailDrawerProps) {
  const dur = bookingDurationMinutes(row)
  const start = timeToMinutes(row.time)
  const endMin = start + dur
  const { label: stLabel, variant } = reservationStatusDisplay(row.status)
  const phone = row.phone.trim()
  const telHref = phone ? `tel:${phone.replace(/\s+/g, '')}` : null

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
              <dd className="text-foreground">
                {telHref ? (
                  <a
                    href={telHref}
                    className="font-medium text-primary underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                  >
                    {phone}
                  </a>
                ) : (
                  adminCopy.common.emDash
                )}
              </dd>
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
            {row.guarantee?.paymentMethodId ? (
              <div>
                <dt className="font-medium text-muted">{adminCopy.bookings.cardOnFile}</dt>
                <dd className="text-foreground text-xs">{row.guarantee.paymentMethodId}</dd>
              </div>
            ) : null}
            {row.cancelReason?.trim() ? (
              <div>
                <dt className="font-medium text-muted">{adminCopy.bookings.chargeFailureReason}</dt>
                <dd className="text-destructive text-xs">{row.cancelReason}</dd>
              </div>
            ) : null}
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
            <BookingAppointmentActions
              row={row}
              layout="stacked"
              guaranteeEnabled={guaranteeEnabled}
              onPatchStatus={onPatchStatus}
              onNoShowCharge={onNoShowCharge}
            />
          </div>
        </div>
      </aside>
    </div>
  )
}
