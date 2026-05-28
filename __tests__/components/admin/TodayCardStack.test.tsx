import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TodayCardStack } from '@/components/admin/TodayCardStack'
import { mockReservation } from '@/components/admin/bookings/admin-components.stories.fixtures'
import { adminCopy } from '@/components/admin/admin-copy'
import type { AdminBookingService } from '@/types/admin'

const services: AdminBookingService[] = [
  {
    id: 'svc-cut',
    name: 'Haircut & Blow Dry',
    description: '',
    durationMinutes: 45,
    price: 45,
    currency: '$',
  },
]

const copy = adminCopy.bookings.appointmentActions

describe('TodayCardStack', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders appointments in chronological order with service pricing', () => {
    render(
      <TodayCardStack
        rows={[
          mockReservation({ id: 'b', time: '14:00', name: 'Later Guest' }),
          mockReservation({ id: 'a', time: '09:30', name: 'Early Guest' }),
        ]}
        services={services}
        dateYmd="2026-05-18"
        onPatchStatus={vi.fn()}
        onCreate={vi.fn()}
      />,
    )

    const cards = screen.getAllByRole('article')
    expect(cards).toHaveLength(2)
    expect(cards[0]).toHaveTextContent('Early Guest')
    expect(cards[1]).toHaveTextContent('Later Guest')
    expect(screen.getAllByText(/Haircut - \$45/)).toHaveLength(2)
  })

  it('shows the reassuring empty state when there are no bookings', () => {
    render(
      <TodayCardStack
        rows={[]}
        services={services}
        dateYmd="2026-05-18"
        onPatchStatus={vi.fn()}
        onCreate={vi.fn()}
      />,
    )

    expect(screen.getByText(adminCopy.bookings.todayStack.emptyToday)).toBeInTheDocument()
  })

  it('disables action buttons while a patch is in flight', async () => {
    let resolvePatch: (() => void) | undefined
    const onPatchStatus = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolvePatch = resolve
        }),
    )

    render(
      <TodayCardStack
        rows={[mockReservation({ id: 'res-1', status: 'confirmed' })]}
        services={services}
        dateYmd="2026-05-18"
        onPatchStatus={onPatchStatus}
        onCreate={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: copy.markComplete }))
    expect(screen.getByRole('button', { name: adminCopy.common.loading })).toBeDisabled()

    resolvePatch?.()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: copy.markComplete })).not.toBeDisabled()
    })
  })

  it('links the call action to tel: and patches status without a full refresh', async () => {
    const onPatchStatus = vi.fn().mockResolvedValue(undefined)
    render(
      <TodayCardStack
        rows={[
          mockReservation({
            id: 'res-1',
            phone: '+34 611 234 567',
            status: 'confirmed',
          }),
        ]}
        services={services}
        dateYmd="2026-05-18"
        onPatchStatus={onPatchStatus}
        onCreate={vi.fn()}
      />,
    )

    const callLink = screen.getByRole('link', { name: copy.callClient })
    expect(callLink).toHaveAttribute('href', 'tel:+34611234567')

    fireEvent.click(screen.getByRole('button', { name: copy.markComplete }))
    await waitFor(() => {
      expect(onPatchStatus).toHaveBeenCalledWith('res-1', 'complete')
    })

    fireEvent.click(screen.getByRole('button', { name: adminCopy.bookings.markNoShow }))
    expect(screen.getByRole('heading', { name: copy.noShowConfirmTitle })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: copy.confirmNoShow }))
    await waitFor(() => {
      expect(onPatchStatus).toHaveBeenCalledWith('res-1', 'no-show')
    })
  })

  it('does not mark no-show when the confirmation modal is dismissed', () => {
    const onPatchStatus = vi.fn()
    render(
      <TodayCardStack
        rows={[mockReservation({ id: 'res-1', status: 'confirmed' })]}
        services={services}
        dateYmd="2026-05-18"
        onPatchStatus={onPatchStatus}
        onCreate={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: adminCopy.bookings.markNoShow }))
    fireEvent.click(screen.getByRole('button', { name: adminCopy.common.back }))
    expect(onPatchStatus).not.toHaveBeenCalled()
  })

  it('shows mark no-show and charge when guarantee is enabled and a card is on file', async () => {
    const onNoShowCharge = vi.fn().mockResolvedValue(undefined)
    render(
      <TodayCardStack
        rows={[
          mockReservation({
            id: 'res-guarantee',
            status: 'confirmed',
            guarantee: {
              paymentMethodId: 'pm_123',
              customerId: 'cus_123',
              status: 'vaulted',
            },
          }),
        ]}
        services={services}
        dateYmd="2026-05-18"
        guaranteeEnabled
        onPatchStatus={vi.fn()}
        onNoShowCharge={onNoShowCharge}
        onCreate={vi.fn()}
      />,
    )

    expect(
      screen.getByRole('button', { name: adminCopy.bookings.markNoShowAndCharge }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: adminCopy.bookings.markNoShow }),
    ).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: adminCopy.bookings.markNoShowAndCharge }))
    expect(screen.getByRole('heading', { name: copy.noShowChargeConfirmTitle })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: copy.confirmNoShowCharge }))
    await waitFor(() => {
      expect(onNoShowCharge).toHaveBeenCalledWith('res-guarantee')
    })
  })
})
