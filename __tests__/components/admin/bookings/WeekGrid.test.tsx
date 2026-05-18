import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { WeekGrid } from '@/components/admin/bookings/WeekGrid'
import { mockReservation } from '@/components/admin/bookings/admin-components.stories.fixtures'

describe('WeekGrid', () => {
  it('partitions bookings by weekday and exposes day/week card actions', () => {
    const onPickDay = vi.fn()
    const onSelect = vi.fn()

    const rowMon = mockReservation({
      id: 'm1',
      date: '2026-05-18',
      time: '09:00',
      name: 'Morning One',
    })
    const rowTue = mockReservation({
      id: 't1',
      date: '2026-05-19',
      time: '15:30',
      name: 'Afternoon Tue',
    })

    render(<WeekGrid weekStart="2026-05-18" rows={[rowTue, rowMon]} onPickDay={onPickDay} onSelect={onSelect} />)

    fireEvent.click(screen.getByRole('button', { name: /Mon · 18/ }))
    fireEvent.click(screen.getByRole('button', { name: /Wed · 20/ }))

    expect(onPickDay).toHaveBeenNthCalledWith(1, '2026-05-18')
    expect(onPickDay).toHaveBeenNthCalledWith(2, '2026-05-20')

    fireEvent.click(screen.getByRole('button', { name: /^09:00, Morning One, Confirmed$/ }))
    fireEvent.click(screen.getByRole('button', { name: /^15:30, Afternoon Tue, Confirmed$/ }))
    expect(onSelect).toHaveBeenCalledWith(rowMon)
    expect(onSelect).toHaveBeenCalledWith(rowTue)
  })
})
