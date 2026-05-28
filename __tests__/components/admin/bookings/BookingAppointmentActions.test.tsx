import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import {
  BookingAppointmentActions,
  isTerminalReservationStatus,
  showNoShowChargeAction,
} from '@/components/admin/bookings/BookingAppointmentActions'
import { mockReservation } from '@/components/admin/bookings/admin-components.stories.fixtures'
import { adminCopy } from '@/components/admin/admin-copy'

const copy = adminCopy.bookings.appointmentActions

describe('BookingAppointmentActions', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders actions in order: call, complete, no-show', () => {
    render(
      <BookingAppointmentActions
        row={mockReservation({ phone: '+34 611 234 567' })}
        layout="inline"
        onPatchStatus={vi.fn()}
      />,
    )

    const buttons = screen.getAllByRole('button')
    const links = screen.getAllByRole('link')
    expect(links[0]).toHaveAccessibleName(copy.callClient)
    expect(buttons[0]).toHaveAccessibleName(copy.markComplete)
    expect(buttons[1]).toHaveAccessibleName(adminCopy.bookings.markNoShow)
  })

  it('links call action to tel: href', () => {
    render(
      <BookingAppointmentActions
        row={mockReservation({ phone: '+34 611 234 567' })}
        layout="stacked"
        onPatchStatus={vi.fn()}
      />,
    )

    expect(screen.getByRole('link', { name: copy.callClient })).toHaveAttribute(
      'href',
      'tel:+34611234567',
    )
  })

  it('requires confirmation before plain no-show patch', async () => {
    const onPatchStatus = vi.fn().mockResolvedValue(undefined)
    render(
      <BookingAppointmentActions
        row={mockReservation({ id: 'res-1', status: 'confirmed' })}
        layout="inline"
        onPatchStatus={onPatchStatus}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: adminCopy.bookings.markNoShow }))
    expect(screen.getByRole('heading', { name: copy.noShowConfirmTitle })).toBeInTheDocument()
    expect(onPatchStatus).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: copy.confirmNoShow }))
    await waitFor(() => {
      expect(onPatchStatus).toHaveBeenCalledWith('res-1', 'no-show')
    })
  })

  it('requires confirmation before no-show charge', async () => {
    const onNoShowCharge = vi.fn().mockResolvedValue(undefined)
    render(
      <BookingAppointmentActions
        row={mockReservation({
          id: 'res-g',
          status: 'confirmed',
          guarantee: { paymentMethodId: 'pm_123', status: 'vaulted' },
        })}
        layout="stacked"
        guaranteeEnabled
        onPatchStatus={vi.fn()}
        onNoShowCharge={onNoShowCharge}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: adminCopy.bookings.markNoShowAndCharge }))
    expect(screen.getByRole('heading', { name: copy.noShowChargeConfirmTitle })).toBeInTheDocument()
    expect(onNoShowCharge).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: copy.confirmNoShowCharge }))
    await waitFor(() => {
      expect(onNoShowCharge).toHaveBeenCalledWith('res-g')
    })
  })

  it('shows charge button with gold styling when guarantee applies', () => {
    render(
      <BookingAppointmentActions
        row={mockReservation({
          guarantee: { paymentMethodId: 'pm_123', status: 'vaulted' },
        })}
        layout="inline"
        guaranteeEnabled
        onPatchStatus={vi.fn()}
        onNoShowCharge={vi.fn()}
      />,
    )

    const chargeButton = screen.getByRole('button', { name: adminCopy.bookings.markNoShowAndCharge })
    expect(chargeButton.className).toMatch(/bg-amber-500/)
    expect(screen.queryByRole('button', { name: adminCopy.bookings.markNoShow })).not.toBeInTheDocument()
  })

  it('disables complete and no-show for terminal statuses', () => {
    render(
      <BookingAppointmentActions
        row={mockReservation({ status: 'completed' })}
        layout="inline"
        onPatchStatus={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: copy.markComplete })).toBeDisabled()
    expect(screen.getByRole('button', { name: adminCopy.bookings.markNoShow })).toBeDisabled()
  })

  it('disables action buttons while a patch is in flight', async () => {
    let resolvePatch: (() => void) | undefined
    const onPatchStatus = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolvePatch = resolve
        }),
    )

    render(
      <BookingAppointmentActions
        row={mockReservation({ status: 'confirmed' })}
        layout="inline"
        onPatchStatus={onPatchStatus}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: copy.markComplete }))
    expect(screen.getByRole('button', { name: adminCopy.common.loading })).toBeDisabled()

    resolvePatch?.()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: copy.markComplete })).not.toBeDisabled()
    })
  })

  it('does not patch when confirmation modal is dismissed', () => {
    const onPatchStatus = vi.fn()
    render(
      <BookingAppointmentActions
        row={mockReservation({ status: 'confirmed' })}
        layout="inline"
        onPatchStatus={onPatchStatus}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: adminCopy.bookings.markNoShow }))
    fireEvent.click(screen.getByRole('button', { name: adminCopy.common.back }))
    expect(onPatchStatus).not.toHaveBeenCalled()
  })
})

describe('isTerminalReservationStatus', () => {
  it.each(['cancelled', 'no-show', 'completed', 'cancelled_and_charged', 'cancelled_charge_failed'])(
    'returns true for %s',
    (status) => {
      expect(isTerminalReservationStatus(status)).toBe(true)
    },
  )

  it('returns false for confirmed', () => {
    expect(isTerminalReservationStatus('confirmed')).toBe(false)
  })
})

describe('showNoShowChargeAction', () => {
  it('returns true when guarantee, card, and handler are present', () => {
    const row = mockReservation({
      guarantee: { paymentMethodId: 'pm_123', status: 'vaulted' },
    })
    expect(showNoShowChargeAction(row, true, vi.fn())).toBe(true)
  })

  it('returns false when guarantee is disabled', () => {
    const row = mockReservation({
      guarantee: { paymentMethodId: 'pm_123', status: 'vaulted' },
    })
    expect(showNoShowChargeAction(row, false, vi.fn())).toBe(false)
  })
})
