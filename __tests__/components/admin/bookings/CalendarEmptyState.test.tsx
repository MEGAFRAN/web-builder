import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CalendarEmptyState } from '@/components/admin/bookings/CalendarEmptyState'

describe('CalendarEmptyState', () => {
  it.each([
    ['closed' as const, 'Feb 29', /Closed · Feb 29/],
    ['empty' as const, undefined, /No appointments for this day/],
  ])('variant %s shows expected headline', (variant, dateLabel, headline) => {
    const onCreate = vi.fn()
    render(<CalendarEmptyState variant={variant} dateLabel={dateLabel} onCreate={onCreate} />)
    expect(screen.getByText(headline)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '+ New appointment' }))
    expect(onCreate).toHaveBeenCalledTimes(1)
  })
})
