import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BookingDetailDrawer } from '@/components/admin/bookings/BookingDetailDrawer'
import { mockReservation } from '@/components/admin/bookings/admin-components.stories.fixtures'
import { adminCopy } from '@/components/admin/admin-copy'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('BookingDetailDrawer', () => {
  it('shows reservation fields and invokes handlers from actions', () => {
    vi.spyOn(Date.prototype, 'toLocaleDateString').mockReturnValue('Mon, May 18, 2026')

    const row = mockReservation({
      durationMinutes: 45,
      time: '10:00',
    })
    const onClose = vi.fn()
    const onCancel = vi.fn()
    const onNoShow = vi.fn()

    render(<BookingDetailDrawer row={row} onClose={onClose} onCancel={onCancel} onNoShow={onNoShow} />)

    expect(screen.getByRole('heading', { name: adminCopy.bookings.appointment })).toBeInTheDocument()
    expect(screen.getByText(row.name)).toBeInTheDocument()
    expect(screen.getByText(row.phone)).toBeInTheDocument()
    expect(screen.getByText(row.email)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: adminCopy.common.closePanel }))
    expect(onClose).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: adminCopy.common.close }))
    expect(onClose).toHaveBeenCalledTimes(2)

    fireEvent.click(screen.getByRole('button', { name: adminCopy.bookings.cancelAppointment }))
    fireEvent.click(screen.getByRole('button', { name: adminCopy.bookings.markNoShow }))
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onNoShow).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['cancelled' as const, [
      [adminCopy.bookings.cancelAppointment, true],
      [adminCopy.bookings.markNoShow, true],
    ]],
    ['no-show' as const, [
      [adminCopy.bookings.cancelAppointment, false],
      [adminCopy.bookings.markNoShow, true],
    ]],
  ] as const)('respects disable rules when status=%s', (status, buttons) => {
    const row = mockReservation({ status })
    render(<BookingDetailDrawer row={row} onClose={vi.fn()} onCancel={vi.fn()} onNoShow={vi.fn()} />)
    buttons.forEach(([label, disabled]) => {
      const btn = screen.getByRole('button', { name: label })
      if (disabled) expect(btn).toBeDisabled()
      else expect(btn).not.toBeDisabled()
    })
  })
})
