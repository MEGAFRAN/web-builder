import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SimpleDayList } from '@/components/admin/bookings/SimpleDayList'
import { mockReservation } from '@/components/admin/bookings/admin-components.stories.fixtures'

describe('SimpleDayList', () => {
  it('lists rows as selectable list cards without a timeline', () => {
    const rows = [mockReservation({ id: '1', name: 'Alex Row' }), mockReservation({ id: '2', name: 'Blake Row', time: '13:30' })]

    const onSelect = vi.fn()
    render(<SimpleDayList rows={rows} onSelect={onSelect} />)

    expect(
      screen.getByText(/This day is marked closed or uses special hours/),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Alex Row, 10:00, Haircut, Confirmed/ }))
    fireEvent.click(screen.getByRole('button', { name: /Blake Row, 13:30, Haircut, Confirmed/ }))

    expect(onSelect).toHaveBeenNthCalledWith(1, rows[0])
    expect(onSelect).toHaveBeenNthCalledWith(2, rows[1])
  })
})
