import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CalendarEmptyState } from '@/components/admin/bookings/CalendarEmptyState'
import { adminCopy, closedHeadline } from '@/components/admin/admin-copy'

describe('CalendarEmptyState', () => {
  it.each([
    ['closed' as const, 'Feb 29', closedHeadline('Feb 29')],
    ['empty' as const, undefined, adminCopy.bookings.emptyDay],
  ])('variant %s shows expected headline', (variant, dateLabel, headline) => {
    const onCreate = vi.fn()
    render(<CalendarEmptyState variant={variant} dateLabel={dateLabel} onCreate={onCreate} />)
    expect(screen.getByText(headline)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: adminCopy.bookings.newAppointmentButton }))
    expect(onCreate).toHaveBeenCalledTimes(1)
  })
})
