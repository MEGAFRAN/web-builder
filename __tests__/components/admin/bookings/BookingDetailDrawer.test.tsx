import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BookingDetailDrawer } from '@/components/admin/bookings/BookingDetailDrawer'
import { mockReservation } from '@/components/admin/bookings/admin-components.stories.fixtures'

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

    expect(screen.getByRole('heading', { name: 'Appointment' })).toBeInTheDocument()
    expect(screen.getByText(row.name)).toBeInTheDocument()
    expect(screen.getByText(row.phone)).toBeInTheDocument()
    expect(screen.getByText(row.email)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Close panel' }))
    expect(onClose).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledTimes(2)

    fireEvent.click(screen.getByRole('button', { name: 'Cancel appointment…' }))
    fireEvent.click(screen.getByRole('button', { name: 'Mark as no-show' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onNoShow).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['cancelled' as const, [
      ['Cancel appointment…', true],
      ['Mark as no-show', true],
    ]],
    ['no-show' as const, [
      ['Cancel appointment…', false],
      ['Mark as no-show', true],
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
