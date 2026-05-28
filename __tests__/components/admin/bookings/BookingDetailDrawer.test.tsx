import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BookingDetailDrawer } from '@/components/admin/bookings/BookingDetailDrawer'
import { mockReservation } from '@/components/admin/bookings/admin-components.stories.fixtures'
import { adminCopy } from '@/components/admin/admin-copy'

const copy = adminCopy.bookings.appointmentActions

afterEach(() => {
  vi.restoreAllMocks()
})

describe('BookingDetailDrawer', () => {
  it('shows reservation fields and invokes handlers from actions', async () => {
    vi.spyOn(Date.prototype, 'toLocaleDateString').mockReturnValue('Mon, May 18, 2026')

    const row = mockReservation({
      durationMinutes: 45,
      time: '10:00',
      phone: '+1 415 555 0100',
    })
    const onClose = vi.fn()
    const onCancel = vi.fn()
    const onPatchStatus = vi.fn().mockResolvedValue(undefined)

    render(
      <BookingDetailDrawer
        row={row}
        onClose={onClose}
        onCancel={onCancel}
        onPatchStatus={onPatchStatus}
      />,
    )

    expect(screen.getByRole('heading', { name: adminCopy.bookings.appointment })).toBeInTheDocument()
    expect(screen.getByText(row.name)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: row.phone })).toHaveAttribute('href', 'tel:+14155550100')
    expect(screen.getByText(row.email)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: adminCopy.common.closePanel }))
    expect(onClose).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: adminCopy.common.close }))
    expect(onClose).toHaveBeenCalledTimes(2)

    fireEvent.click(screen.getByRole('button', { name: adminCopy.bookings.cancelAppointment }))
    expect(onCancel).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: copy.markComplete }))
    await waitFor(() => {
      expect(onPatchStatus).toHaveBeenCalledWith(row.id, 'complete')
    })

    fireEvent.click(screen.getByRole('button', { name: adminCopy.bookings.markNoShow }))
    fireEvent.click(screen.getByRole('button', { name: copy.confirmNoShow }))
    await waitFor(() => {
      expect(onPatchStatus).toHaveBeenCalledWith(row.id, 'no-show')
    })
  })

  it.each([
    ['cancelled' as const, [
      [adminCopy.bookings.cancelAppointment, true],
      [copy.markComplete, true],
      [adminCopy.bookings.markNoShow, true],
    ]],
    ['no-show' as const, [
      [adminCopy.bookings.cancelAppointment, false],
      [copy.markComplete, true],
      [adminCopy.bookings.markNoShow, true],
    ]],
  ] as const)('respects disable rules when status=%s', (status, buttons) => {
    const row = mockReservation({ status })
    render(
      <BookingDetailDrawer
        row={row}
        onClose={vi.fn()}
        onCancel={vi.fn()}
        onPatchStatus={vi.fn()}
      />,
    )
    buttons.forEach(([label, disabled]) => {
      const btn = screen.getByRole('button', { name: label })
      if (disabled) expect(btn).toBeDisabled()
      else expect(btn).not.toBeDisabled()
    })
  })

  it('shows the charge button when guarantee is enabled and a card is on file', async () => {
    const onNoShowCharge = vi.fn().mockResolvedValue(undefined)
    const row = mockReservation({
      guarantee: { paymentMethodId: 'pm_mock_local_12345', status: 'vaulted' },
    })

    render(
      <BookingDetailDrawer
        row={row}
        guaranteeEnabled
        onNoShowCharge={onNoShowCharge}
        onClose={vi.fn()}
        onCancel={vi.fn()}
        onPatchStatus={vi.fn()}
      />,
    )

    const chargeButton = screen.getByRole('button', { name: adminCopy.bookings.markNoShowAndCharge })
    expect(chargeButton).not.toBeDisabled()
    expect(chargeButton.className).toMatch(/bg-amber-500/)
    expect(screen.queryByRole('button', { name: adminCopy.bookings.markNoShow })).not.toBeInTheDocument()

    fireEvent.click(chargeButton)
    fireEvent.click(screen.getByRole('button', { name: copy.confirmNoShowCharge }))
    await waitFor(() => {
      expect(onNoShowCharge).toHaveBeenCalledWith(row.id)
    })
  })

  it('falls back to mark-no-show when guarantee is disabled even with a card on file', () => {
    const row = mockReservation({
      guarantee: { paymentMethodId: 'pm_mock_local_12345', status: 'vaulted' },
    })

    render(
      <BookingDetailDrawer
        row={row}
        guaranteeEnabled={false}
        onNoShowCharge={vi.fn()}
        onClose={vi.fn()}
        onCancel={vi.fn()}
        onPatchStatus={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: adminCopy.bookings.markNoShow })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: adminCopy.bookings.markNoShowAndCharge })).not.toBeInTheDocument()
  })

  it('shows the charge failure reason when present on the reservation', () => {
    const row = mockReservation({
      status: 'cancelled_charge_failed',
      cancelReason: 'Invalid currency: €.',
      guarantee: { paymentMethodId: 'pm_mock_local_12345', status: 'vaulted' },
    })

    render(
      <BookingDetailDrawer
        row={row}
        guaranteeEnabled
        onNoShowCharge={vi.fn()}
        onClose={vi.fn()}
        onCancel={vi.fn()}
        onPatchStatus={vi.fn()}
      />,
    )

    expect(screen.getByText(adminCopy.bookings.chargeFailureReason)).toBeInTheDocument()
    expect(screen.getByText('Invalid currency: €.')).toBeInTheDocument()
  })
})
