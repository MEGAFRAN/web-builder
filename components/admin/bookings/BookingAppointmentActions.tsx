'use client'

import { useState } from 'react'
import { AdminModal } from '@/components/admin/AdminModal'
import { adminCopy } from '@/components/admin/admin-copy'
import type { ReservationRow } from '@/types/admin'

export type BookingAppointmentPatchAction = 'no-show' | 'complete'

type PendingAction = BookingAppointmentPatchAction | 'no-show-charge'

type NoShowConfirmVariant = 'patch' | 'charge'

export interface BookingAppointmentActionsProps {
  row: ReservationRow
  layout: 'inline' | 'stacked'
  guaranteeEnabled?: boolean
  onPatchStatus: (id: string, action: BookingAppointmentPatchAction) => Promise<void>
  onNoShowCharge?: (id: string) => Promise<void>
}

export function isTerminalReservationStatus(status: string): boolean {
  return (
    status === 'cancelled' ||
    status === 'no-show' ||
    status === 'completed' ||
    status === 'cancelled_and_charged' ||
    status === 'cancelled_charge_failed'
  )
}

export function showNoShowChargeAction(
  row: ReservationRow,
  guaranteeEnabled: boolean,
  onNoShowCharge?: (id: string) => Promise<void>,
): boolean {
  return (
    guaranteeEnabled &&
    Boolean(row.guarantee?.paymentMethodId) &&
    onNoShowCharge !== undefined &&
    row.status !== 'cancelled_and_charged' &&
    row.status !== 'cancelled_charge_failed'
  )
}

const callButtonClass =
  'inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-fg hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none'

const callButtonDisabledClass =
  'inline-flex min-h-11 min-w-11 cursor-not-allowed items-center justify-center rounded-lg border border-border px-4 py-3 text-center text-sm font-medium text-muted opacity-50'

const completeButtonClass =
  'inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none'

const noShowButtonClass =
  'inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm font-semibold text-yellow-900 hover:bg-yellow-100 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none'

const chargeNoShowButtonClass =
  'inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg bg-amber-500 px-4 py-3 text-sm font-semibold text-amber-950 hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none'

const stackedCompleteButtonClass =
  'rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none min-h-11'

const stackedNoShowButtonClass =
  'rounded-md border border-yellow-300 bg-yellow-50 px-4 py-2 text-sm font-semibold text-yellow-900 hover:bg-yellow-100 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none min-h-11'

const stackedChargeNoShowButtonClass =
  'rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none min-h-11'

const stackedCallLinkClass =
  'inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 py-2 text-center text-sm font-semibold text-primary-fg hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none'

const stackedCallDisabledClass =
  'inline-flex min-h-11 cursor-not-allowed items-center justify-center rounded-md border border-border px-4 py-2 text-center text-sm font-medium text-muted opacity-50'

export function BookingAppointmentActions({
  row,
  layout,
  guaranteeEnabled = false,
  onPatchStatus,
  onNoShowCharge,
}: BookingAppointmentActionsProps) {
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [noShowConfirm, setNoShowConfirm] = useState<NoShowConfirmVariant | null>(null)

  const terminal = isTerminalReservationStatus(row.status)
  const phone = row.phone.trim()
  const telHref = phone ? `tel:${phone.replace(/\s+/g, '')}` : null
  const useChargeNoShow = showNoShowChargeAction(row, guaranteeEnabled, onNoShowCharge)
  const isInline = layout === 'inline'

  async function runPatchAction(action: BookingAppointmentPatchAction) {
    if (pendingAction) return
    setPendingAction(action)
    try {
      await onPatchStatus(row.id, action)
    } finally {
      setPendingAction(null)
    }
  }

  async function runNoShowCharge() {
    if (pendingAction || !onNoShowCharge) return
    setPendingAction('no-show-charge')
    try {
      await onNoShowCharge(row.id)
    } finally {
      setPendingAction(null)
    }
  }

  async function confirmNoShowAction() {
    if (noShowConfirm === 'charge') {
      setNoShowConfirm(null)
      await runNoShowCharge()
      return
    }
    if (noShowConfirm === 'patch') {
      setNoShowConfirm(null)
      await runPatchAction('no-show')
    }
  }

  const copy = adminCopy.bookings.appointmentActions

  const noShowConfirmTitle =
    noShowConfirm === 'charge' ? copy.noShowChargeConfirmTitle : copy.noShowConfirmTitle

  const noShowConfirmMessage =
    noShowConfirm === 'charge'
      ? copy.noShowChargeConfirmMessage(row.name)
      : copy.noShowConfirmMessage(row.name, row.time)

  const noShowConfirmLabel =
    noShowConfirm === 'charge' ? copy.confirmNoShowCharge : copy.confirmNoShow

  const containerClass = isInline
    ? 'grid grid-cols-1 gap-2 sm:grid-cols-3'
    : 'flex flex-col gap-2'

  const chargeDisabled =
    row.status === 'cancelled' ||
    row.status === 'no-show' ||
    row.status === 'cancelled_and_charged' ||
    pendingAction !== null

  return (
    <>
      <div className={containerClass}>
        {telHref ? (
          <a
            href={telHref}
            className={isInline ? callButtonClass : stackedCallLinkClass}
          >
            {copy.callClient}
          </a>
        ) : (
          <span
            aria-disabled="true"
            className={isInline ? callButtonDisabledClass : stackedCallDisabledClass}
          >
            {copy.callClient}
          </span>
        )}

        <button
          type="button"
          disabled={terminal || pendingAction !== null}
          onClick={() => void runPatchAction('complete')}
          className={isInline ? completeButtonClass : stackedCompleteButtonClass}
        >
          {pendingAction === 'complete' ? adminCopy.common.loading : copy.markComplete}
        </button>

        {useChargeNoShow ? (
          <button
            type="button"
            disabled={chargeDisabled}
            onClick={() => setNoShowConfirm('charge')}
            className={isInline ? chargeNoShowButtonClass : stackedChargeNoShowButtonClass}
          >
            {pendingAction === 'no-show-charge'
              ? adminCopy.common.loading
              : adminCopy.bookings.markNoShowAndCharge}
          </button>
        ) : (
          <button
            type="button"
            disabled={terminal || pendingAction !== null}
            onClick={() => setNoShowConfirm('patch')}
            className={isInline ? noShowButtonClass : stackedNoShowButtonClass}
          >
            {pendingAction === 'no-show' ? adminCopy.common.loading : adminCopy.bookings.markNoShow}
          </button>
        )}
      </div>

      <AdminModal
        open={noShowConfirm !== null}
        title={noShowConfirmTitle}
        labelledById={`no-show-confirm-title-${row.id}`}
        descriptionId={`no-show-confirm-desc-${row.id}`}
        onClose={() => setNoShowConfirm(null)}
        footer={
          <>
            <button
              type="button"
              className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted-bg focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              onClick={() => setNoShowConfirm(null)}
            >
              {adminCopy.common.back}
            </button>
            <button
              type="button"
              disabled={pendingAction !== null}
              className={
                noShowConfirm === 'charge'
                  ? 'rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none'
                  : 'rounded-md bg-yellow-100 px-4 py-2 text-sm font-semibold text-yellow-900 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none'
              }
              onClick={() => void confirmNoShowAction()}
            >
              {pendingAction !== null ? adminCopy.common.loading : noShowConfirmLabel}
            </button>
          </>
        }
      >
        <p id={`no-show-confirm-desc-${row.id}`} className="text-sm text-muted">
          {noShowConfirmMessage}
        </p>
      </AdminModal>
    </>
  )
}
