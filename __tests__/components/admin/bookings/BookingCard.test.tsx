import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BookingCard } from '@/components/admin/bookings/BookingCard'
import { mockReservation } from '@/components/admin/bookings/admin-components.stories.fixtures'

describe('BookingCard', () => {
  const baseRow = mockReservation({
    id: 'r1',
    name: 'Taylor Kim',
    time: '10:00',
    serviceName: 'Cut',
    status: 'confirmed',
  })

  it.each([
    [
      'list' as const,
      undefined as string | undefined,
      /Taylor Kim, 10:00, Cut, Confirmed/,
      [/Taylor Kim/, /10:00/, /Cut/],
    ],
    ['timeline' as const, '11:00', /Taylor Kim, Cut, 10:00–11:00, Confirmed/, [/Cut/, /10:00 – 11:00/]],
    ['week' as const, undefined, /10:00, Taylor Kim, Confirmed/, [/10:00/, /Taylor Kim/]],
  ] as const)(
    '%s renders expected copy and activates on click',
    (variant, endLabel, namePattern, substrings) => {
      const onClick = vi.fn()
      render(<BookingCard row={baseRow} variant={variant} endLabel={endLabel} onClick={onClick} />)
      const btn = screen.getByRole('button', { name: namePattern })
      substrings.forEach((s) => expect(btn.textContent).toMatch(s))
      fireEvent.click(btn)
      expect(onClick).toHaveBeenCalledTimes(1)
    },
  )

  it('applies dimmed styling for cancelled timeline bookings', () => {
    render(
      <BookingCard row={mockReservation({ status: 'cancelled' })} variant="timeline" endLabel="11:00" onClick={vi.fn()} />,
    )
    expect(screen.getByRole('button').className).toMatch(/opacity-60/)
  })
})
