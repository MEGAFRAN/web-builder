import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CalendarNavBar } from '@/components/admin/bookings/CalendarNavBar'
import { addDaysYmd, formatYmd } from '@/lib/booking-utils'

describe('CalendarNavBar', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 4, 18, 12, 0, 0))
  })

  it('navigates the selected date and toggles view mode', () => {
    const onSelectedYmdChange = vi.fn()
    const onViewChange = vi.fn()
    render(
      <CalendarNavBar
        selectedYmd="2026-05-18"
        onSelectedYmdChange={onSelectedYmdChange}
        view="day"
        onViewChange={onViewChange}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Previous' }))
    expect(onSelectedYmdChange).toHaveBeenLastCalledWith(addDaysYmd('2026-05-18', -1))

    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(onSelectedYmdChange).toHaveBeenLastCalledWith(addDaysYmd('2026-05-18', 1))

    fireEvent.change(screen.getByLabelText(/Jump to date/), {
      target: { value: '2026-12-31' },
    })
    expect(onSelectedYmdChange).toHaveBeenLastCalledWith('2026-12-31')

    fireEvent.click(screen.getByRole('button', { name: 'Week' }))
    expect(onViewChange).toHaveBeenLastCalledWith('week')

    fireEvent.click(screen.getByRole('button', { name: 'Day' }))
    expect(onViewChange).toHaveBeenLastCalledWith('day')

    fireEvent.click(screen.getByRole('button', { name: 'Today' }))
    expect(onSelectedYmdChange).toHaveBeenLastCalledWith(formatYmd(new Date()))
  })

  it('reflects pressed state for the active calendar view mode', () => {
    render(
      <CalendarNavBar
        selectedYmd="2026-05-18"
        onSelectedYmdChange={vi.fn()}
        view="week"
        onViewChange={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: 'Week' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Day' })).toHaveAttribute('aria-pressed', 'false')
  })
})
