import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { NewAppointmentModal } from '@/components/admin/bookings/NewAppointmentModal'
import { adminCopy } from '@/components/admin/admin-copy'

function jsonResponse(body: unknown, init?: ResponseInit) {
  return Response.json(body, init)
}

describe('NewAppointmentModal', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo) => {
        const url = typeof input === 'string' ? input : input.url

        if (url.startsWith('/api/admin/services')) {
          return jsonResponse({
            services: [
              { id: 'svc-a', name: 'Cut', durationMinutes: 45 },
              { id: 'svc-b', name: 'Color', durationMinutes: 90 },
            ],
          })
        }

        if (url.startsWith('/api/availability')) {
          expect(url).toContain('clientId=test-client')
          expect(url).toContain('date=')
          return jsonResponse({
            bookedSlots: ['09:30', '21:30'],
            outOfWindowSlots: [],
          })
        }

        if (url === '/api/admin/reservations') {
          return jsonResponse({}, { status: 201 })
        }

        throw new Error(`Unexpected fetch URL: ${url}`)
      }),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function waitUntilReady() {
    return waitFor(() => expect(screen.getAllByRole('combobox')).toHaveLength(2))
  }

  function timeSelect(): HTMLSelectElement {
    const selects = screen.getAllByRole('combobox')
    return selects[1] as HTMLSelectElement
  }

  it('requires a chosen time before submitting', async () => {
    const onClose = vi.fn()

    render(
      <NewAppointmentModal
        clientId="test-client"
        initialDate="2026-06-05"
        onClose={onClose}
        onCreated={vi.fn()}
      />,
    )

    await waitUntilReady()
    fireEvent.click(screen.getByRole('button', { name: adminCopy.common.save }))

    expect(await screen.findByText(adminCopy.appointmentForm.selectServiceDateTime)).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('calls onCreated after a successful save', async () => {
    const onCreated = vi.fn()
    const onClose = vi.fn()

    render(
      <NewAppointmentModal
        clientId="test-client"
        initialDate="2026-06-05"
        onClose={onClose}
        onCreated={onCreated}
      />,
    )

    await waitUntilReady()

    const slot = [...timeSelect().querySelectorAll('option')]
      .map((o) => o.value)
      .find(Boolean)
    if (!slot) throw new Error('expected at least one open slot')
    fireEvent.change(timeSelect(), { target: { value: slot } })

    fireEvent.change(screen.getByRole('textbox', { name: adminCopy.appointmentForm.customerName }), {
      target: { value: 'Casey' },
    })
    fireEvent.change(screen.getByRole('textbox', { name: adminCopy.appointmentForm.phone }), {
      target: { value: '555-1234' },
    })
    fireEvent.change(screen.getByRole('textbox', { name: adminCopy.appointmentForm.email }), {
      target: { value: 'casey@example.com' },
    })

    fireEvent.click(screen.getByRole('button', { name: adminCopy.common.save }))

    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1))
    expect(onClose).not.toHaveBeenCalled()
  })
})
