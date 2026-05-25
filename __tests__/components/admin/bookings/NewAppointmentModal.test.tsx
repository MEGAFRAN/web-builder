import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { NewAppointmentModal } from '@/components/admin/bookings/NewAppointmentModal'
import { adminCopy } from '@/components/admin/admin-copy'
import { BOOKING_SLOT_GRID } from '@/lib/booking-slot-grid'

function jsonResponse(body: unknown, init?: ResponseInit) {
  return Response.json(body, init)
}

const defaultServices = [
  { id: 'svc-a', name: 'Cut', durationMinutes: 45 },
  { id: 'svc-b', name: 'Color', durationMinutes: 90 },
]

function defaultFetchHandler(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === 'string' ? input : input instanceof Request ? input.url : input.href

  if (url.startsWith('/api/admin/services')) {
    return Promise.resolve(jsonResponse({ services: defaultServices }))
  }

  if (url.startsWith('/api/availability')) {
    return Promise.resolve(
      jsonResponse({
        bookedSlots: ['09:30'],
        outOfWindowSlots: ['10:00'],
      }),
    )
  }

  if (url === '/api/admin/reservations' && init?.method === 'POST') {
    return Promise.resolve(jsonResponse({}, { status: 201 }))
  }

  return Promise.reject(new Error(`Unexpected fetch URL: ${url}`))
}

describe('NewAppointmentModal', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(defaultFetchHandler))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function renderModal(overrides: Partial<Parameters<typeof NewAppointmentModal>[0]> = {}) {
    const props = {
      clientId: 'test-client',
      initialDate: '2026-06-05',
      onClose: vi.fn(),
      onCreated: vi.fn(),
      ...overrides,
    }
    render(<NewAppointmentModal {...props} />)
    return props
  }

  async function waitUntilReady() {
    await waitFor(() => expect(screen.getAllByRole('combobox')).toHaveLength(2))
  }

  function serviceSelect(): HTMLSelectElement {
    return screen.getAllByRole('combobox')[0] as HTMLSelectElement
  }

  function timeSelect(): HTMLSelectElement {
    return screen.getAllByRole('combobox')[1] as HTMLSelectElement
  }

  function timeSlotValues(): string[] {
    return [...timeSelect().querySelectorAll('option')]
      .map((option) => option.value)
      .filter(Boolean)
  }

  async function fillCustomerFields() {
    fireEvent.change(screen.getByRole('textbox', { name: adminCopy.appointmentForm.customerName }), {
      target: { value: 'Casey' },
    })
    fireEvent.change(screen.getByRole('textbox', { name: adminCopy.appointmentForm.phone }), {
      target: { value: '555-1234' },
    })
    fireEvent.change(screen.getByRole('textbox', { name: adminCopy.appointmentForm.email }), {
      target: { value: 'casey@example.com' },
    })
  }

  function availabilityCalls(): string[] {
    return vi
      .mocked(fetch)
      .mock.calls.map((call) => (typeof call[0] === 'string' ? call[0] : String(call[0])))
      .filter((url) => url.startsWith('/api/availability'))
  }

  async function expectAvailabilityFetch(date: string, duration: number) {
    const expected = `/api/availability?clientId=test-client&date=${date}&duration=${duration}`
    await waitFor(() => {
      expect(availabilityCalls()).toContain(expected)
    })
  }

  async function pickFirstOpenSlot() {
    await waitFor(() => expect(timeSlotValues().length).toBeGreaterThan(0))
    const slot = timeSlotValues()[0]
    fireEvent.change(timeSelect(), { target: { value: slot } })
    return slot
  }

  it('requires a chosen time before submitting', async () => {
    const { onClose } = renderModal()

    await waitUntilReady()
    fireEvent.click(screen.getByRole('button', { name: adminCopy.common.save }))

    expect(await screen.findByText(adminCopy.appointmentForm.selectServiceDateTime)).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('calls onCreated after a successful save', async () => {
    const { onCreated, onClose } = renderModal()

    await waitUntilReady()
    await pickFirstOpenSlot()
    await fillCustomerFields()

    fireEvent.click(screen.getByRole('button', { name: adminCopy.common.save }))

    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('posts the reservation payload to the admin API', async () => {
    renderModal()

    await waitUntilReady()
    const slot = await pickFirstOpenSlot()
    await fillCustomerFields()
    fireEvent.change(screen.getByRole('textbox', { name: adminCopy.appointmentForm.notes }), {
      target: { value: 'First visit' },
    })

    fireEvent.click(screen.getByRole('button', { name: adminCopy.common.save }))

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/admin/reservations',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serviceId: 'svc-a',
            date: '2026-06-05',
            time: slot,
            name: 'Casey',
            email: 'casey@example.com',
            phone: '555-1234',
            notes: 'First visit',
          }),
        }),
      )
    })
  })

  it('omits booked and out-of-window slots from the time select', async () => {
    renderModal()

    await waitUntilReady()
    await waitFor(() => {
      const slots = timeSlotValues()
      expect(slots).toContain('09:00')
      expect(slots).not.toContain('09:30')
      expect(slots).not.toContain('10:00')
      expect(slots.length).toBe(BOOKING_SLOT_GRID.length - 2)
    })
  })

  it('requests availability for the selected client, date, and service duration', async () => {
    renderModal({ initialDate: '2026-06-05' })

    await waitUntilReady()
    await expectAvailabilityFetch('2026-06-05', 45)
  })

  it('refetches availability when the date changes', async () => {
    renderModal()

    await waitUntilReady()
    await expectAvailabilityFetch('2026-06-05', 45)

    fireEvent.change(screen.getByLabelText(adminCopy.appointmentForm.date), {
      target: { value: '2026-06-06' },
    })

    await expectAvailabilityFetch('2026-06-06', 45)
  })

  it('shows an error when services fail to load', async () => {
    vi.mocked(fetch).mockImplementationOnce(async () => {
      throw new Error('services down')
    })

    renderModal()

    expect(await screen.findByText(adminCopy.appointmentForm.failedLoadServices)).toBeInTheDocument()
  })

  it('shows the API error message when save fails', async () => {
    vi.mocked(fetch).mockImplementation(async (input, init) => {
      const url = typeof input === 'string' ? input : input instanceof Request ? input.url : input.href

      if (url.startsWith('/api/admin/services')) {
        return jsonResponse({ services: defaultServices })
      }
      if (url.startsWith('/api/availability')) {
        return jsonResponse({ bookedSlots: [], outOfWindowSlots: [] })
      }
      if (url === '/api/admin/reservations' && init?.method === 'POST') {
        return jsonResponse({ error: 'That slot is no longer available.' }, { status: 409 })
      }
      throw new Error(`Unexpected fetch URL: ${url}`)
    })

    renderModal()

    await waitUntilReady()
    await pickFirstOpenSlot()
    await fillCustomerFields()
    fireEvent.click(screen.getByRole('button', { name: adminCopy.common.save }))

    expect(await screen.findByText('That slot is no longer available.')).toBeInTheDocument()
  })

  it('shows the generic save failure copy when the API response has no error body', async () => {
    vi.mocked(fetch).mockImplementation(async (input, init) => {
      const url = typeof input === 'string' ? input : input instanceof Request ? input.url : input.href

      if (url.startsWith('/api/admin/services')) {
        return jsonResponse({ services: defaultServices })
      }
      if (url.startsWith('/api/availability')) {
        return jsonResponse({ bookedSlots: [], outOfWindowSlots: [] })
      }
      if (url === '/api/admin/reservations' && init?.method === 'POST') {
        return jsonResponse({}, { status: 500 })
      }
      throw new Error(`Unexpected fetch URL: ${url}`)
    })

    renderModal()

    await waitUntilReady()
    await pickFirstOpenSlot()
    await fillCustomerFields()
    fireEvent.click(screen.getByRole('button', { name: adminCopy.common.save }))

    expect(await screen.findByText(adminCopy.appointmentForm.saveFailed)).toBeInTheDocument()
  })

  it('shows the generic save error copy when the reservation request throws', async () => {
    vi.mocked(fetch).mockImplementation(async (input, init) => {
      const url = typeof input === 'string' ? input : input instanceof Request ? input.url : input.href

      if (url.startsWith('/api/admin/services')) {
        return jsonResponse({ services: defaultServices })
      }
      if (url.startsWith('/api/availability')) {
        return jsonResponse({ bookedSlots: [], outOfWindowSlots: [] })
      }
      if (url === '/api/admin/reservations' && init?.method === 'POST') {
        return Promise.reject('network down')
      }
      throw new Error(`Unexpected fetch URL: ${url}`)
    })

    renderModal()

    await waitUntilReady()
    await pickFirstOpenSlot()
    await fillCustomerFields()
    fireEvent.click(screen.getByRole('button', { name: adminCopy.common.save }))

    expect(await screen.findByText(adminCopy.appointmentForm.saveError)).toBeInTheDocument()
  })

  it('invokes onClose from the cancel button', async () => {
    const { onClose } = renderModal()

    await waitUntilReady()
    fireEvent.click(screen.getByRole('button', { name: adminCopy.common.cancel }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('updates the selected service and duration in the service select', async () => {
    renderModal()

    await waitUntilReady()
    expect(serviceSelect()).toHaveValue('svc-a')
    expect(serviceSelect().options[0].textContent).toBe('Cut (45 min)')

    fireEvent.change(serviceSelect(), { target: { value: 'svc-b' } })

    expect(serviceSelect()).toHaveValue('svc-b')
    await expectAvailabilityFetch('2026-06-05', 90)
  })
})
