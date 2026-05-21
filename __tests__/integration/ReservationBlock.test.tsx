import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import ReservationBlock from '@/components/blocks/ReservationBlock'
import type { ReservationBlock as ReservationBlockProps } from '@/types/cms'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const SERVICES = [
  {
    id: 'standard-meal',
    name: 'Standard meal',
    description: 'Two courses with seasonal sides.',
    durationMinutes: 60,
    price: 45,
    currency: '€',
  },
  {
    id: 'tasting-menu',
    name: 'Tasting menu',
    description: 'Chef selection across several courses.',
    durationMinutes: 120,
    price: 95,
    currency: '€',
  },
] satisfies NonNullable<ReservationBlockProps['services']>

const baseProps: ReservationBlockProps = {
  _type: 'reservationBlock',
  heading: 'Make a Reservation',
  subtext: 'Book your visit online.',
  services: SERVICES,
  confirmationMessage: null,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pickService(serviceName = SERVICES[0].name) {
  fireEvent.click(screen.getByRole('button', { name: new RegExp(serviceName, 'i') }))
}

function pickDate(date = '2026-12-25') {
  fireEvent.change(document.getElementById('res-date')!, { target: { value: date } })
}

function pickSlot(slot = '13:00') {
  fireEvent.click(screen.getByRole('button', { name: slot }))
}

function fillGuestDetails({
  name = 'Jane Smith',
  email = 'jane@example.com',
  phone = '+34 600 000 000',
} = {}) {
  fireEvent.change(document.getElementById('res-name')!, { target: { value: name } })
  fireEvent.change(document.getElementById('res-email')!, { target: { value: email } })
  fireEvent.change(document.getElementById('res-phone')!, { target: { value: phone } })
}

function submitForm() {
  fireEvent.submit(document.querySelector('form')!)
}

function jsonResponse(data: unknown): Response {
  return {
    ok: true,
    json: async () => data,
  } as Response
}

function fetchInputUrl(input: Parameters<typeof fetch>[0]): string {
  return typeof input === 'string' ? input : input instanceof Request ? input.url : input.href
}

function reservationPostCalls(fetchSpy: { mock: { calls: unknown[][] } }): [string, RequestInit][] {
  return fetchSpy.mock.calls.filter(
    (c): c is [string, RequestInit] =>
      Array.isArray(c) &&
      typeof c[0] === 'string' &&
      c[0] === '/api/reservation' &&
      typeof c[1] === 'object' &&
      c[1] !== null,
  )
}

/** Mount resolves `/api/booking-services` in an effect; flush past the microtask chain so setState runs inside act. */
async function renderReservation(ui: Parameters<typeof render>[0]) {
  const utils = render(ui)
  await act(async () => {
    await new Promise<void>(resolve => setTimeout(resolve, 0))
  })
  return utils
}

/** Walk through the full happy path up to (but not including) submission. */
function completeForm(overrides?: Parameters<typeof fillGuestDetails>[0]) {
  pickService()
  pickDate()
  pickSlot()
  fillGuestDetails(overrides)
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ReservationBlock', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((input: Parameters<typeof fetch>[0]) => {
      const url = fetchInputUrl(input)
      if (url.includes('/api/booking-services')) {
        return Promise.resolve(jsonResponse({ services: [] }))
      }
      return Promise.reject(new Error(`Unexpected fetch: ${url}`))
    })
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

describe('ReservationBlock — initial render', () => {
  it('renders the section wrapper with data-component attribute', async () => {
    const { container } = await renderReservation(<ReservationBlock {...baseProps} />)
    expect(container.querySelector('[data-component="reservation-block"]')).toBeInTheDocument()
  })

  it('displays heading and subtext when provided', async () => {
    await renderReservation(<ReservationBlock {...baseProps} />)
    expect(screen.getByRole('heading', { name: 'Make a Reservation' })).toBeInTheDocument()
    expect(screen.getByText('Book your visit online.')).toBeInTheDocument()
  })

  it('does not render a heading or subtext section when both are omitted', async () => {
    await renderReservation(<ReservationBlock _type="reservationBlock" services={SERVICES} />)
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })

  it('renders only heading when subtext is omitted', async () => {
    await renderReservation(<ReservationBlock _type="reservationBlock" heading="Reserve" services={SERVICES} />)
    expect(screen.getByRole('heading', { name: 'Reserve' })).toBeInTheDocument()
  })

  it('shows booking unavailable when services list is empty', async () => {
    await renderReservation(<ReservationBlock _type="reservationBlock" services={[]} heading="Book" />)
    await waitFor(() => {
      expect(screen.getByText(/no hay servicios configurados/i)).toBeInTheDocument()
    })
    expect(document.querySelector('form')).not.toBeInTheDocument()
  })

  it('shows service choices before date input', async () => {
    await renderReservation(<ReservationBlock {...baseProps} />)
    expect(screen.getByRole('button', { name: /standard meal/i })).toBeInTheDocument()
    expect(document.getElementById('res-date')).not.toBeInTheDocument()
  })

  it('prefers non-empty admin catalog over CMS services prop', async () => {
    fetchSpy.mockImplementation((input: Parameters<typeof fetch>[0]) => {
      const url = fetchInputUrl(input)
      if (url.includes('/api/booking-services')) {
        return Promise.resolve(
          jsonResponse({
            services: [
              {
                id: 'admin-only',
                name: 'From admin',
                description: 'Managed in portal',
                durationMinutes: 45,
                price: 12,
                currency: '€',
              },
            ],
          }),
        )
      }
      return Promise.reject(new Error(`Unexpected fetch: ${url}`))
    })

    await renderReservation(<ReservationBlock {...baseProps} />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /from admin/i })).toBeInTheDocument()
    })
    expect(screen.queryByRole('button', { name: /standard meal/i })).not.toBeInTheDocument()
  })

  it('does not show time slots before a date is chosen', async () => {
    await renderReservation(<ReservationBlock {...baseProps} />)
    pickService()
    expect(screen.queryByRole('button', { name: '09:00' })).not.toBeInTheDocument()
  })

  it('does not show guest detail fields before a date is chosen', async () => {
    await renderReservation(<ReservationBlock {...baseProps} />)
    pickService()
    expect(document.getElementById('res-name')).not.toBeInTheDocument()
  })
})

describe('ReservationBlock — step flow: service → date reveals time slots', () => {
  it('shows the date field after picking a service', async () => {
    await renderReservation(<ReservationBlock {...baseProps} />)
    pickService()
    expect(document.getElementById('res-date')).toBeInTheDocument()
  })

  it('shows the time slot grid after picking a date', async () => {
    await renderReservation(<ReservationBlock {...baseProps} />)
    pickService()
    pickDate()
    expect(screen.getByRole('button', { name: '09:00' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '13:00' })).toBeInTheDocument()
  })

  it('does not show guest form fields until a time slot is selected', async () => {
    await renderReservation(<ReservationBlock {...baseProps} />)
    pickService()
    pickDate()
    expect(document.getElementById('res-name')).not.toBeInTheDocument()
  })
})

describe('ReservationBlock — time selection reveals guest form', () => {
  it('shows the guest detail fields after picking a time slot', async () => {
    await renderReservation(<ReservationBlock {...baseProps} />)
    pickService()
    pickDate()
    pickSlot()
    expect(document.getElementById('res-name')).toBeInTheDocument()
    expect(document.getElementById('res-email')).toBeInTheDocument()
    expect(document.getElementById('res-phone')).toBeInTheDocument()
    expect(document.getElementById('res-notes')).toBeInTheDocument()
  })

  it('shows the submit button once the guest form is visible', async () => {
    await renderReservation(<ReservationBlock {...baseProps} />)
    pickService()
    pickDate()
    pickSlot()
    expect(screen.getByRole('button', { name: /confirmar reserva/i })).toBeInTheDocument()
  })

  it('applies selected styling to the chosen time slot button', async () => {
    await renderReservation(<ReservationBlock {...baseProps} />)
    pickService()
    pickDate()
    const slotBtn = screen.getByRole('button', { name: '13:00' })
    fireEvent.click(slotBtn)
    expect(slotBtn.className).toContain('bg-primary')
  })

  it('changing the date resets time selection and hides guest form', async () => {
    await renderReservation(<ReservationBlock {...baseProps} />)
    pickService()
    pickDate('2026-12-25')
    pickSlot()
    expect(document.getElementById('res-name')).toBeInTheDocument()

    pickDate('2026-12-26')
    expect(document.getElementById('res-name')).not.toBeInTheDocument()
  })

  it('changing the service clears date and time and hides guest form', async () => {
    await renderReservation(<ReservationBlock {...baseProps} />)
    pickService(SERVICES[0].name)
    pickDate()
    pickSlot()
    expect(document.getElementById('res-name')).toBeInTheDocument()

    pickService(SERVICES[1].name)
    const dateInput = document.getElementById('res-date') as HTMLInputElement
    expect(dateInput).toBeInTheDocument()
    expect(dateInput.value).toBe('')
    expect(document.getElementById('res-name')).not.toBeInTheDocument()
  })
})

describe('ReservationBlock — submit button state', () => {
  beforeEach(async () => {
    await renderReservation(<ReservationBlock {...baseProps} />)
    pickService()
    pickDate()
    pickSlot()
  })

  it('disables submit button when required text fields are empty', () => {
    expect(screen.getByRole('button', { name: /confirmar reserva/i })).toBeDisabled()
  })

  it('enables submit button only when all required fields are filled', () => {
    fillGuestDetails()
    expect(screen.getByRole('button', { name: /confirmar reserva/i })).not.toBeDisabled()
  })

  it('disables submit button when name is whitespace-only', () => {
    fillGuestDetails({ name: '   ' })
    expect(screen.getByRole('button', { name: /confirmar reserva/i })).toBeDisabled()
  })
})

describe('ReservationBlock — form submission', () => {
  it('POSTs to /api/reservation with the correct payload', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ services: [] }))
    fetchSpy.mockResolvedValueOnce({ ok: true } as Response)
    await renderReservation(<ReservationBlock {...baseProps} />)
    completeForm()
    submitForm()

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled())

    const reservationCalls = reservationPostCalls(fetchSpy)
    expect(reservationCalls).toHaveLength(1)

    const [, init] = reservationCalls[0]
    expect(init.method).toBe('POST')

    const body = JSON.parse(init.body as string)
    expect(body).toMatchObject({
      serviceId: 'standard-meal',
      durationMinutes: 60,
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '+34 600 000 000',
      date: '2026-12-25',
      time: '13:00',
    })
  })

  it('trims whitespace from name, email and phone before sending', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ services: [] }))
    fetchSpy.mockResolvedValueOnce({ ok: true } as Response)
    await renderReservation(<ReservationBlock {...baseProps} />)
    completeForm({ name: '  Jane Smith  ', email: ' jane@example.com ', phone: ' +34 600 000 000 ' })
    submitForm()

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled())
    const reservationCalls = reservationPostCalls(fetchSpy)
    const body = JSON.parse(reservationCalls[0][1].body as string)
    expect(body.name).toBe('Jane Smith')
    expect(body.email).toBe('jane@example.com')
    expect(body.phone).toBe('+34 600 000 000')
  })

  it('omits notes from payload when notes field is empty', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ services: [] }))
    fetchSpy.mockResolvedValueOnce({ ok: true } as Response)
    await renderReservation(<ReservationBlock {...baseProps} />)
    completeForm()
    submitForm()

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled())
    const reservationCalls = reservationPostCalls(fetchSpy)
    const body = JSON.parse(reservationCalls[0][1].body as string)
    expect(body.notes).toBeUndefined()
  })

  it('includes notes in payload when filled in', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ services: [] }))
    fetchSpy.mockResolvedValueOnce({ ok: true } as Response)
    await renderReservation(<ReservationBlock {...baseProps} />)
    pickService()
    pickDate()
    pickSlot()
    fillGuestDetails()
    fireEvent.change(document.getElementById('res-notes')!, { target: { value: 'Window seat please' } })
    submitForm()

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled())
    const reservationCalls = reservationPostCalls(fetchSpy)
    const body = JSON.parse(reservationCalls[0][1].body as string)
    expect(body.notes).toBe('Window seat please')
  })

  it('shows the success screen after a successful submission', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ services: [] }))
    fetchSpy.mockResolvedValueOnce({ ok: true } as Response)
    await renderReservation(<ReservationBlock {...baseProps} />)
    completeForm()
    submitForm()

    await waitFor(() => {
      expect(screen.getByText(/reserva confirmada/i)).toBeInTheDocument()
    })
    expect(document.querySelector('form')).not.toBeInTheDocument()
  })

  it('shows the default confirmation message on success when confirmationMessage is null', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ services: [] }))
    fetchSpy.mockResolvedValueOnce({ ok: true } as Response)
    await renderReservation(<ReservationBlock {...baseProps} confirmationMessage={null} />)
    completeForm()
    submitForm()

    await waitFor(() => {
      expect(screen.getByText(/hemos recibido tu solicitud/i)).toBeInTheDocument()
    })
  })

  it('shows a custom confirmationMessage on success', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ services: [] }))
    fetchSpy.mockResolvedValueOnce({ ok: true } as Response)
    await renderReservation(<ReservationBlock {...baseProps} confirmationMessage="See you soon!" />)
    completeForm()
    submitForm()

    await waitFor(() => {
      expect(screen.getByText('See you soon!')).toBeInTheDocument()
    })
  })

  it('shows an error alert when the API returns a non-OK response', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ services: [] }))
    fetchSpy.mockResolvedValueOnce({ ok: false } as Response)
    await renderReservation(<ReservationBlock {...baseProps} />)
    completeForm()
    submitForm()

    await waitFor(() => {
      expect(screen.getByText(/algo ha fallado/i)).toBeInTheDocument()
    })
    expect(document.querySelector('form')).toBeInTheDocument()
  })

  it('shows an error alert when fetch rejects (network error)', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ services: [] }))
    fetchSpy.mockRejectedValueOnce(new Error('Network failure'))
    await renderReservation(<ReservationBlock {...baseProps} />)
    completeForm()
    submitForm()

    await waitFor(() => {
      expect(screen.getByText(/no hemos podido conectar/i)).toBeInTheDocument()
    })
  })

  it('changes button label to "Confirming…" while submitting', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ services: [] }))
    fetchSpy.mockImplementationOnce(() => new Promise(() => {}))
    await renderReservation(<ReservationBlock {...baseProps} />)
    completeForm()
    submitForm()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /confirmando/i })).toBeInTheDocument()
    })
  })

  it('disables the submit button while submitting', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ services: [] }))
    fetchSpy.mockImplementationOnce(() => new Promise(() => {}))
    await renderReservation(<ReservationBlock {...baseProps} />)
    completeForm()
    submitForm()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /confirmando/i })).toBeDisabled()
    })
  })

  it('does not submit when canSubmit is false (guard against programmatic calls)', async () => {
    await renderReservation(<ReservationBlock {...baseProps} />)
    pickService()
    pickDate()
    pickSlot()
    submitForm()
    expect(reservationPostCalls(fetchSpy)).toHaveLength(0)
  })

  it('renders success without block heading when heading and subtext are omitted', async () => {
    fetchSpy.mockResolvedValueOnce(jsonResponse({ services: [] }))
    fetchSpy.mockResolvedValueOnce({ ok: true } as Response)
    await renderReservation(<ReservationBlock _type="reservationBlock" services={SERVICES} />)
    completeForm()
    submitForm()

    await waitFor(() => {
      expect(screen.getByText(/reserva confirmada/i)).toBeInTheDocument()
    })
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })

  it('shows slot-taken message when reservation API returns 409', async () => {
    fetchSpy.mockImplementation((input: Parameters<typeof fetch>[0]) => {
      const url = fetchInputUrl(input)
      if (url.includes('/api/booking-services')) {
        return Promise.resolve(jsonResponse({ services: [] }))
      }
      if (url.includes('/api/availability')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ bookedSlots: [] }),
        } as Response)
      }
      if (url.includes('/api/reservation')) {
        return Promise.resolve({
          ok: false,
          status: 409,
          json: async () => ({}),
        } as Response)
      }
      return Promise.reject(new Error(`Unexpected fetch in test: ${url}`))
    })

    await renderReservation(<ReservationBlock {...baseProps} clientId="client-a" />)
    completeForm()
    submitForm()

    await waitFor(() => {
      expect(screen.getByText(/time slot was just taken/i)).toBeInTheDocument()
    })
  })

  it('shows slot-taken message when error JSON contains SLOT_TAKEN', async () => {
    fetchSpy.mockImplementation((input: Parameters<typeof fetch>[0]) => {
      const url = fetchInputUrl(input)
      if (url.includes('/api/booking-services')) {
        return Promise.resolve(jsonResponse({ services: [] }))
      }
      if (url.includes('/api/availability')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ bookedSlots: [] }),
        } as Response)
      }
      if (url.includes('/api/reservation')) {
        return Promise.resolve({
          ok: false,
          status: 400,
          json: async () => ({ error: 'SLOT_TAKEN' }),
        } as Response)
      }
      return Promise.reject(new Error(`Unexpected fetch in test: ${url}`))
    })

    await renderReservation(<ReservationBlock {...baseProps} clientId="client-a" />)
    completeForm()
    submitForm()

    await waitFor(() => {
      expect(screen.getByText(/time slot was just taken/i)).toBeInTheDocument()
    })
  })

  it('shows generic error when non-OK reservation response JSON cannot be parsed', async () => {
    fetchSpy.mockImplementation((input: Parameters<typeof fetch>[0]) => {
      const url = fetchInputUrl(input)
      if (url.includes('/api/booking-services')) {
        return Promise.resolve(jsonResponse({ services: [] }))
      }
      if (url.includes('/api/availability')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ bookedSlots: [] }),
        } as Response)
      }
      if (url.includes('/api/reservation')) {
        return Promise.resolve({
          ok: false,
          status: 400,
          json: async () => {
            throw new SyntaxError('invalid json')
          },
        } as unknown as Response)
      }
      return Promise.reject(new Error(`Unexpected fetch in test: ${url}`))
    })

    await renderReservation(<ReservationBlock {...baseProps} clientId="client-a" />)
    completeForm()
    submitForm()

    await waitFor(() => {
      expect(screen.getByText(/algo ha fallado/i)).toBeInTheDocument()
    })
  })

  it('shows generic error when API JSON parses but error is not SLOT_TAKEN', async () => {
    fetchSpy.mockImplementation((input: Parameters<typeof fetch>[0]) => {
      const url = fetchInputUrl(input)
      if (url.includes('/api/booking-services')) {
        return Promise.resolve(jsonResponse({ services: [] }))
      }
      if (url.includes('/api/availability')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ bookedSlots: [] }),
        } as Response)
      }
      if (url.includes('/api/reservation')) {
        return Promise.resolve({
          ok: false,
          status: 422,
          json: async () => ({ error: 'VALIDATION_FAILED' }),
        } as Response)
      }
      return Promise.reject(new Error(`Unexpected fetch in test: ${url}`))
    })

    await renderReservation(<ReservationBlock {...baseProps} clientId="client-a" />)
    completeForm()
    submitForm()

    await waitFor(() => {
      expect(screen.getByText(/algo ha fallado/i)).toBeInTheDocument()
    })
  })
})

describe('ReservationBlock — availability integration', () => {
  beforeEach(() => {
    fetchSpy.mockImplementation((input: Parameters<typeof fetch>[0]) => {
      const url = fetchInputUrl(input)
      if (url.includes('/api/booking-services')) {
        return Promise.resolve(jsonResponse({ services: [] }))
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ bookedSlots: [] }),
      } as Response)
    })
  })

  it('fetches availability when clientId, service, and date are set', async () => {
    fetchSpy.mockImplementation((input: Parameters<typeof fetch>[0]) => {
      const url = fetchInputUrl(input)
      if (url.includes('/api/booking-services')) {
        return Promise.resolve(jsonResponse({ services: [] }))
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ bookedSlots: [] }),
      } as Response)
    })

    await renderReservation(<ReservationBlock {...baseProps} clientId="rest-pepe" />)
    pickService()
    pickDate('2026-06-01')

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          '/api/availability?clientId=rest-pepe&date=2026-06-01&duration=60',
        ),
      )
    })
  })

  it('treats missing bookedSlots in availability JSON as an empty list', async () => {
    fetchSpy.mockImplementation((input: Parameters<typeof fetch>[0]) => {
      const url = fetchInputUrl(input)
      if (url.includes('/api/booking-services')) {
        return Promise.resolve(jsonResponse({ services: [] }))
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      } as Response)
    })

    await renderReservation(<ReservationBlock {...baseProps} clientId="scoped" />)
    pickService()
    pickDate()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '13:00' })).toBeInTheDocument()
    })
    expect(screen.queryByRole('button', { name: /completo/i })).not.toBeInTheDocument()
  })

  it('uses availabilityEndpoint when provided', async () => {
    fetchSpy.mockImplementation((input: Parameters<typeof fetch>[0]) => {
      const url = fetchInputUrl(input)
      if (url.includes('/api/booking-services')) {
        return Promise.resolve(jsonResponse({ services: [] }))
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ bookedSlots: [] }),
      } as Response)
    })

    render(
      <ReservationBlock
        {...baseProps}
        clientId="c1"
        availabilityEndpoint="https://api.example.com/v1/booked"
      />,
    )
    pickService()
    pickDate('2026-12-25')

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        'https://api.example.com/v1/booked?clientId=c1&date=2026-12-25&duration=60',
      )
    })
  })

  it('passes selected service duration to availability when not the first service', async () => {
    fetchSpy.mockImplementation((input: Parameters<typeof fetch>[0]) => {
      const url = fetchInputUrl(input)
      if (url.includes('/api/booking-services')) {
        return Promise.resolve(jsonResponse({ services: [] }))
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ bookedSlots: [] }),
      } as Response)
    })

    await renderReservation(<ReservationBlock {...baseProps} clientId="dur-test" />)
    pickService(SERVICES[1].name)
    pickDate()

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('duration=120'),
      )
    })
  })

  it('shows a loading status while availability is loading', async () => {
    let finish!: (r: Response) => void
    const availability = new Promise<Response>(resolve => {
      finish = resolve
    })
    fetchSpy.mockImplementation((input: Parameters<typeof fetch>[0]) => {
      const url = fetchInputUrl(input)
      if (url.includes('/api/booking-services')) {
        return Promise.resolve(jsonResponse({ services: [] }))
      }
      return availability
    })

    await renderReservation(<ReservationBlock {...baseProps} clientId="x" />)
    pickService()
    pickDate()

    await waitFor(() => {
      expect(screen.getByText(/comprobando disponibilidad/i)).toBeInTheDocument()
    })

    finish({
      ok: true,
      json: async () => ({ bookedSlots: [] }),
    } as Response)

    await waitFor(() => {
      expect(screen.queryByText(/comprobando disponibilidad/i)).not.toBeInTheDocument()
    })
  })

  it('reflects booked slots returned by the availability API', async () => {
    fetchSpy.mockImplementation((input: Parameters<typeof fetch>[0]) => {
      const url = fetchInputUrl(input)
      if (url.includes('/api/booking-services')) {
        return Promise.resolve(jsonResponse({ services: [] }))
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ bookedSlots: ['13:00'] }),
      } as Response)
    })

    await renderReservation(<ReservationBlock {...baseProps} clientId="x" />)
    pickService()
    pickDate()

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /13:00.*completo/i }),
      ).toBeInTheDocument()
    })
  })

  it('reflects out-of-window slots from the availability API separately from booked slots', async () => {
    fetchSpy.mockImplementation((input: Parameters<typeof fetch>[0]) => {
      const url = fetchInputUrl(input)
      if (url.includes('/api/booking-services')) {
        return Promise.resolve(jsonResponse({ services: [] }))
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          bookedSlots: [],
          outOfWindowSlots: ['21:00'],
        }),
      } as Response)
    })

    await renderReservation(<ReservationBlock {...baseProps} clientId="x" />)
    pickService()
    pickDate()

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /21:00.*fuera del horario/i }),
      ).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: '14:00' }))
    expect(screen.getByRole('button', { name: '14:00' })).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(screen.getByRole('button', { name: /21:00.*fuera del horario/i }))
    expect(screen.getByRole('button', { name: '14:00' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('does not change selection when clicking a booked slot', async () => {
    fetchSpy.mockImplementation((input: Parameters<typeof fetch>[0]) => {
      const url = fetchInputUrl(input)
      if (url.includes('/api/booking-services')) {
        return Promise.resolve(jsonResponse({ services: [] }))
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ bookedSlots: ['13:00'] }),
      } as Response)
    })

    await renderReservation(<ReservationBlock {...baseProps} clientId="x" />)
    pickService()
    pickDate()

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /13:00.*completo/i })).toBeInTheDocument(),
    )

    fireEvent.click(screen.getByRole('button', { name: '14:00' }))
    expect(screen.getByRole('button', { name: '14:00' })).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(screen.getByRole('button', { name: /13:00.*completo/i }))
    expect(screen.getByRole('button', { name: '14:00' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('treats a non-OK availability response as no booked slots', async () => {
    fetchSpy.mockImplementation((input: Parameters<typeof fetch>[0]) => {
      const url = fetchInputUrl(input)
      if (url.includes('/api/booking-services')) {
        return Promise.resolve(jsonResponse({ services: [] }))
      }
      return Promise.resolve({
        ok: false,
        status: 500,
      } as Response)
    })

    await renderReservation(<ReservationBlock {...baseProps} clientId="x" />)
    pickService()
    pickDate()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '13:00' })).toBeInTheDocument()
    })
    expect(screen.queryByRole('button', { name: /completo/i })).not.toBeInTheDocument()
  })

  it('recovers with empty booked slots when availability fetch rejects', async () => {
    fetchSpy.mockImplementation((input: Parameters<typeof fetch>[0]) => {
      const url = fetchInputUrl(input)
      if (url.includes('/api/booking-services')) {
        return Promise.resolve(jsonResponse({ services: [] }))
      }
      return Promise.reject(new Error('network'))
    })

    await renderReservation(<ReservationBlock {...baseProps} clientId="x" />)
    pickService()
    pickDate()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '13:00' })).toBeInTheDocument()
    })
  })
})

describe('end-time range label', () => {
  it('is absent before a slot is selected', async () => {
    await renderReservation(<ReservationBlock {...baseProps} />)
    pickService()
    pickDate()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '09:00' })).toBeInTheDocument()
    })
    expect(screen.queryByText(/Seleccionado:/)).toBeNull()
  })

  it('shows "HH:MM – HH:MM (N min)" after selecting a slot', async () => {
    await renderReservation(<ReservationBlock {...baseProps} />)
    pickService()
    pickDate()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '09:30' })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: '09:30' }))
    expect(screen.getByText('09:30 – 10:30')).toBeInTheDocument()
    expect(screen.getByText(/\(60 min\)/)).toBeInTheDocument()
  })

  it('updates when the user clicks a different slot', async () => {
    await renderReservation(<ReservationBlock {...baseProps} />)
    pickService()
    pickDate()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '09:30' })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: '09:30' }))
    expect(screen.getByText('09:30 – 10:30')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '11:00' }))
    expect(screen.getByText('11:00 – 12:00')).toBeInTheDocument()
    expect(screen.queryByText('09:30 – 10:30')).not.toBeInTheDocument()
  })

  it('disappears when the date is cleared', async () => {
    await renderReservation(<ReservationBlock {...baseProps} />)
    pickService()
    pickDate()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '09:30' })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: '09:30' }))
    expect(screen.getByText(/Seleccionado:/)).toBeInTheDocument()

    fireEvent.change(document.getElementById('res-date')!, { target: { value: '' } })
    expect(screen.queryByText(/Seleccionado:/)).toBeNull()
  })
})

describe('covered slots', () => {
  it('slots inside the selected window have aria-disabled="true"', async () => {
    await renderReservation(<ReservationBlock {...baseProps} />)
    pickService()
    pickDate()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '09:30' })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: '09:30' }))
    expect(screen.getByRole('button', { name: /10:00/ })).toHaveAttribute('aria-disabled', 'true')
  })

  it('clicking a covered slot does not change the selection', async () => {
    await renderReservation(<ReservationBlock {...baseProps} />)
    pickService()
    pickDate()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '09:30' })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: '09:30' }))
    expect(screen.getByText('09:30 – 10:30')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /10:00.*dentro de tu reserva/i }))
    expect(screen.getByText('09:30 – 10:30')).toBeInTheDocument()
  })

  it('the slot at the exact end time is NOT covered', async () => {
    await renderReservation(<ReservationBlock {...baseProps} />)
    pickService()
    pickDate()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '09:30' })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: '09:30' }))
    expect(screen.getByRole('button', { name: /^10:30$/ })).not.toHaveAttribute('aria-disabled', 'true')
  })

  it('covered slots are cleared when the selection changes', async () => {
    await renderReservation(<ReservationBlock {...baseProps} />)
    pickService()
    pickDate()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '09:30' })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: '09:30' }))
    expect(screen.getByRole('button', { name: /10:00/ })).toHaveAttribute('aria-disabled', 'true')

    fireEvent.click(screen.getByRole('button', { name: '11:00' }))
    expect(screen.getByRole('button', { name: /^10:00$/ })).not.toHaveAttribute('aria-disabled', 'true')
  })
})

describe('slot unavailability reasons', () => {
  beforeEach(() => {
    fetchSpy.mockImplementation((input: Parameters<typeof fetch>[0]) => {
      const url = fetchInputUrl(input)
      if (url.includes('/api/booking-services')) {
        return Promise.resolve(jsonResponse({ services: [] }))
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          bookedSlots: ['13:00'],
          outOfWindowSlots: ['21:00'],
        }),
      } as Response)
    })
  })

  it('booked slots have accessible label containing "fully booked"', async () => {
    await renderReservation(<ReservationBlock {...baseProps} clientId="reason-split" />)
    pickService()
    pickDate()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /13:00.*completo/i })).toBeInTheDocument()
    })
  })

  it('out-of-window slots have accessible label containing "fuera de horario"', async () => {
    await renderReservation(<ReservationBlock {...baseProps} clientId="reason-split" />)
    pickService()
    pickDate()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /21:00.*fuera del horario/i })).toBeInTheDocument()
    })
  })

  it('booked and out-of-window slots render with different visual classes', async () => {
    await renderReservation(<ReservationBlock {...baseProps} clientId="reason-split" />)
    pickService()
    pickDate()

    const bookedBtn = await screen.findByRole('button', { name: /13:00.*completo/i })
    const oowBtn = screen.getByRole('button', { name: /21:00.*fuera del horario/i })

    expect(bookedBtn.className).toContain('line-through')
    expect(oowBtn.className).not.toContain('line-through')
  })
})

describe('ReservationBlock — inline field validation', () => {
  beforeEach(async () => {
    await renderReservation(<ReservationBlock {...baseProps} />)
    pickService()
    pickDate()
    pickSlot()
  })

  it('shows the name validation message after blur', async () => {
    const input = document.getElementById('res-name') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'x' } })
    fireEvent.blur(input)

    expect(await screen.findByText(/introduce un nombre completo/i)).toBeInTheDocument()
  })

  it('shows the email validation message after blur', async () => {
    const input = document.getElementById('res-email') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'not-an-email' } })
    fireEvent.blur(input)

    expect(await screen.findByText(/introduce un correo electrónico válido/i)).toBeInTheDocument()
  })

  it('shows the phone validation message after blur', async () => {
    const input = document.getElementById('res-phone') as HTMLInputElement
    fireEvent.change(input, { target: { value: '123' } })
    fireEvent.blur(input)

    expect(await screen.findByText(/introduce un teléfono válido/i)).toBeInTheDocument()
  })
})

describe('ReservationBlock — accessibility', () => {
  it('associates each label with its input via matching htmlFor and id', async () => {
    await renderReservation(<ReservationBlock {...baseProps} />)
    pickService()
    pickDate()
    pickSlot()

    const labeledIds = ['res-name', 'res-email', 'res-phone', 'res-notes']
    labeledIds.forEach(id => {
      const el = document.getElementById(id)
      expect(el, `#${id} should exist`).toBeInTheDocument()
      const label = document.querySelector(`label[for="${id}"]`)
      expect(label, `label[for="${id}"] should exist`).toBeInTheDocument()
    })
  })

  it('marks the section with the correct data-component attribute', async () => {
    const { container } = await renderReservation(<ReservationBlock {...baseProps} />)
    const section = container.querySelector('[data-component="reservation-block"]')
    expect(section?.tagName).toBe('SECTION')
  })

  it('does not render a heading element when heading prop is not provided', async () => {
    await renderReservation(<ReservationBlock _type="reservationBlock" subtext="A subtitle" services={SERVICES} />)
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })
})
})
