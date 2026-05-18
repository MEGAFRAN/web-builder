import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CalendarNavBar } from '@/components/admin/bookings/CalendarNavBar'
import { addDaysYmd, formatYmd } from '@/lib/booking-utils'
import { adminCopy } from '@/components/admin/admin-copy'

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

    fireEvent.click(screen.getByRole('button', { name: adminCopy.calendar.previous }))
    expect(onSelectedYmdChange).toHaveBeenLastCalledWith(addDaysYmd('2026-05-18', -1))

    fireEvent.click(screen.getByRole('button', { name: adminCopy.calendar.next }))
    expect(onSelectedYmdChange).toHaveBeenLastCalledWith(addDaysYmd('2026-05-18', 1))

    fireEvent.change(screen.getByLabelText(adminCopy.calendar.jumpToDate), {
      target: { value: '2026-12-31' },
    })
    expect(onSelectedYmdChange).toHaveBeenLastCalledWith('2026-12-31')

    fireEvent.click(screen.getByRole('button', { name: adminCopy.calendar.week }))
    expect(onViewChange).toHaveBeenLastCalledWith('week')

    fireEvent.click(screen.getByRole('button', { name: adminCopy.calendar.day }))
    expect(onViewChange).toHaveBeenLastCalledWith('day')

    fireEvent.click(screen.getByRole('button', { name: adminCopy.calendar.today }))
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
    expect(screen.getByRole('button', { name: adminCopy.calendar.week })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: adminCopy.calendar.day })).toHaveAttribute('aria-pressed', 'false')
  })
})
