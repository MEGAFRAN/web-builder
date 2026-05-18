import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DayTimeline } from '@/components/admin/bookings/DayTimeline'
import { mockReservation } from '@/components/admin/bookings/admin-components.stories.fixtures'

describe('DayTimeline', () => {
  it('layouts hour ticks and wires booking selection through timeline booking cards', () => {
    const rows = [
      mockReservation({
        id: 'a',
        time: '10:00',
        durationMinutes: 60,
        name: 'Row One',
        serviceName: 'Cut',
      }),
      mockReservation({
        id: 'b',
        time: '12:30',
        durationMinutes: 30,
        name: 'Row Two',
        serviceName: 'Wash',
      }),
    ]

    const onSelect = vi.fn()
    render(
      <DayTimeline
        rows={rows}
        openMin={10 * 60}
        closeMin={14 * 60}
        ppm={1}
        timelineHeight={400}
        onSelect={onSelect}
      />,
    )

    expect(screen.getByText('10:00')).toBeInTheDocument()
    expect(screen.getByText('11:00')).toBeInTheDocument()
    expect(screen.getByText('12:00')).toBeInTheDocument()

    fireEvent.click(
      screen.getByRole('button', { name: /Row One, Cut, 10:00–11:00/ }),
    )
    fireEvent.click(
      screen.getByRole('button', { name: /Row Two, Wash, 12:30–13:00/ }),
    )

    expect(onSelect).toHaveBeenNthCalledWith(1, rows[0])
    expect(onSelect).toHaveBeenNthCalledWith(2, rows[1])
  })
})
