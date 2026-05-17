import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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

/** Walk through the full happy path up to (but not including) submission. */
function completeForm(overrides?: Parameters<typeof fillGuestDetails>[0]) {
  pickService()
  pickDate()
  pickSlot()
  fillGuestDetails(overrides)
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ReservationBlock — initial render', () => {
  it('renders the section wrapper with data-component attribute', () => {
    const { container } = render(<ReservationBlock {...baseProps} />)
    expect(container.querySelector('[data-component="reservation-block"]')).toBeInTheDocument()
  })

  it('displays heading and subtext when provided', () => {
    render(<ReservationBlock {...baseProps} />)
    expect(screen.getByRole('heading', { name: 'Make a Reservation' })).toBeInTheDocument()
    expect(screen.getByText('Book your visit online.')).toBeInTheDocument()
  })

  it('does not render a heading or subtext section when both are omitted', () => {
    render(<ReservationBlock _type="reservationBlock" services={SERVICES} />)
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })

  it('renders only heading when subtext is omitted', () => {
    render(<ReservationBlock _type="reservationBlock" heading="Reserve" services={SERVICES} />)
    expect(screen.getByRole('heading', { name: 'Reserve' })).toBeInTheDocument()
  })

  it('shows booking unavailable when services list is empty', () => {
    render(<ReservationBlock _type="reservationBlock" services={[]} heading="Book" />)
    expect(screen.getByText(/no services are configured/i)).toBeInTheDocument()
    expect(document.querySelector('form')).not.toBeInTheDocument()
  })

  it('shows service choices before date input', () => {
    render(<ReservationBlock {...baseProps} />)
    expect(screen.getByRole('button', { name: /standard meal/i })).toBeInTheDocument()
    expect(document.getElementById('res-date')).not.toBeInTheDocument()
  })

  it('does not show time slots before a date is chosen', () => {
    render(<ReservationBlock {...baseProps} />)
    pickService()
    expect(screen.queryByRole('button', { name: '09:00' })).not.toBeInTheDocument()
  })

  it('does not show guest detail fields before a date is chosen', () => {
    render(<ReservationBlock {...baseProps} />)
    pickService()
    expect(document.getElementById('res-name')).not.toBeInTheDocument()
  })
})

describe('ReservationBlock — step flow: service → date reveals time slots', () => {
  it('shows the date field after picking a service', () => {
    render(<ReservationBlock {...baseProps} />)
    pickService()
    expect(document.getElementById('res-date')).toBeInTheDocument()
  })

  it('shows the time slot grid after picking a date', () => {
    render(<ReservationBlock {...baseProps} />)
    pickService()
    pickDate()
    expect(screen.getByRole('button', { name: '09:00' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '13:00' })).toBeInTheDocument()
  })

  it('does not show guest form fields until a time slot is selected', () => {
    render(<ReservationBlock {...baseProps} />)
    pickService()
    pickDate()
    expect(document.getElementById('res-name')).not.toBeInTheDocument()
  })
})

describe('ReservationBlock — time selection reveals guest form', () => {
  it('shows the guest detail fields after picking a time slot', () => {
    render(<ReservationBlock {...baseProps} />)
    pickService()
    pickDate()
    pickSlot()
    expect(document.getElementById('res-name')).toBeInTheDocument()
    expect(document.getElementById('res-email')).toBeInTheDocument()
    expect(document.getElementById('res-phone')).toBeInTheDocument()
    expect(document.getElementById('res-notes')).toBeInTheDocument()
  })

  it('shows the submit button once the guest form is visible', () => {
    render(<ReservationBlock {...baseProps} />)
    pickService()
    pickDate()
    pickSlot()
    expect(screen.getByRole('button', { name: /confirm reservation/i })).toBeInTheDocument()
  })

  it('applies selected styling to the chosen time slot button', () => {
    render(<ReservationBlock {...baseProps} />)
    pickService()
    pickDate()
    const slotBtn = screen.getByRole('button', { name: '13:00' })
    fireEvent.click(slotBtn)
    expect(slotBtn.className).toContain('bg-primary')
  })

  it('changing the date resets time selection and hides guest form', () => {
    render(<ReservationBlock {...baseProps} />)
    pickService()
    pickDate('2026-12-25')
    pickSlot()
    expect(document.getElementById('res-name')).toBeInTheDocument()

    pickDate('2026-12-26')
    expect(document.getElementById('res-name')).not.toBeInTheDocument()
  })

  it('changing the service clears date and time and hides guest form', () => {
    render(<ReservationBlock {...baseProps} />)
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
  beforeEach(() => {
    render(<ReservationBlock {...baseProps} />)
    pickService()
    pickDate()
    pickSlot()
  })

  it('disables submit button when required text fields are empty', () => {
    expect(screen.getByRole('button', { name: /confirm reservation/i })).toBeDisabled()
  })

  it('enables submit button only when all required fields are filled', () => {
    fillGuestDetails()
    expect(screen.getByRole('button', { name: /confirm reservation/i })).not.toBeDisabled()
  })

  it('disables submit button when name is whitespace-only', () => {
    fillGuestDetails({ name: '   ' })
    expect(screen.getByRole('button', { name: /confirm reservation/i })).toBeDisabled()
  })
})

describe('ReservationBlock — form submission', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  it('POSTs to /api/reservation with the correct payload', async () => {
    fetchSpy.mockResolvedValueOnce({ ok: true } as Response)
    render(<ReservationBlock {...baseProps} />)
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
    fetchSpy.mockResolvedValueOnce({ ok: true } as Response)
    render(<ReservationBlock {...baseProps} />)
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
    fetchSpy.mockResolvedValueOnce({ ok: true } as Response)
    render(<ReservationBlock {...baseProps} />)
    completeForm()
    submitForm()

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled())
    const reservationCalls = reservationPostCalls(fetchSpy)
    const body = JSON.parse(reservationCalls[0][1].body as string)
    expect(body.notes).toBeUndefined()
  })

  it('includes notes in payload when filled in', async () => {
    fetchSpy.mockResolvedValueOnce({ ok: true } as Response)
    render(<ReservationBlock {...baseProps} />)
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
    fetchSpy.mockResolvedValueOnce({ ok: true } as Response)
    render(<ReservationBlock {...baseProps} />)
    completeForm()
    submitForm()

    await waitFor(() => {
      expect(screen.getByText(/reservation confirmed/i)).toBeInTheDocument()
    })
    expect(document.querySelector('form')).not.toBeInTheDocument()
  })

  it('shows the default confirmation message on success when confirmationMessage is null', async () => {
    fetchSpy.mockResolvedValueOnce({ ok: true } as Response)
    render(<ReservationBlock {...baseProps} confirmationMessage={null} />)
    completeForm()
    submitForm()

    await waitFor(() => {
      expect(screen.getByText(/we've received your request/i)).toBeInTheDocument()
    })
  })

  it('shows a custom confirmationMessage on success', async () => {
    fetchSpy.mockResolvedValueOnce({ ok: true } as Response)
    render(<ReservationBlock {...baseProps} confirmationMessage="See you soon!" />)
    completeForm()
    submitForm()

    await waitFor(() => {
      expect(screen.getByText('See you soon!')).toBeInTheDocument()
    })
  })

  it('shows an error alert when the API returns a non-OK response', async () => {
    fetchSpy.mockResolvedValueOnce({ ok: false } as Response)
    render(<ReservationBlock {...baseProps} />)
    completeForm()
    submitForm()

    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    })
    expect(document.querySelector('form')).toBeInTheDocument()
  })

  it('shows an error alert when fetch rejects (network error)', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('Network failure'))
    render(<ReservationBlock {...baseProps} />)
    completeForm()
    submitForm()

    await waitFor(() => {
      expect(screen.getByText(/couldn't reach our reservations system/i)).toBeInTheDocument()
    })
  })

  it('changes button label to "Confirming…" while submitting', async () => {
    fetchSpy.mockImplementationOnce(() => new Promise(() => {}))
    render(<ReservationBlock {...baseProps} />)
    completeForm()
    submitForm()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /confirming/i })).toBeInTheDocument()
    })
  })

  it('disables the submit button while submitting', async () => {
    fetchSpy.mockImplementationOnce(() => new Promise(() => {}))
    render(<ReservationBlock {...baseProps} />)
    completeForm()
    submitForm()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /confirming/i })).toBeDisabled()
    })
  })

  it('does not submit when canSubmit is false (guard against programmatic calls)', () => {
    render(<ReservationBlock {...baseProps} />)
    pickService()
    pickDate()
    pickSlot()
    submitForm()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('renders success without block heading when heading and subtext are omitted', async () => {
    fetchSpy.mockResolvedValueOnce({ ok: true } as Response)
    render(<ReservationBlock _type="reservationBlock" services={SERVICES} />)
    completeForm()
    submitForm()

    await waitFor(() => {
      expect(screen.getByText(/reservation confirmed/i)).toBeInTheDocument()
    })
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })

  it('shows slot-taken message when reservation API returns 409', async () => {
    fetchSpy.mockImplementation((input: RequestInfo) => {
      const url = typeof input === 'string' ? input : (input as Request).url
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

    render(<ReservationBlock {...baseProps} clientId="client-a" />)
    completeForm()
    submitForm()

    await waitFor(() => {
      expect(screen.getByText(/time slot was just taken/i)).toBeInTheDocument()
    })
  })

  it('shows slot-taken message when error JSON contains SLOT_TAKEN', async () => {
    fetchSpy.mockImplementation((input: RequestInfo) => {
      const url = typeof input === 'string' ? input : (input as Request).url
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

    render(<ReservationBlock {...baseProps} clientId="client-a" />)
    completeForm()
    submitForm()

    await waitFor(() => {
      expect(screen.getByText(/time slot was just taken/i)).toBeInTheDocument()
    })
  })

  it('shows generic error when non-OK reservation response JSON cannot be parsed', async () => {
    fetchSpy.mockImplementation((input: RequestInfo) => {
      const url = typeof input === 'string' ? input : (input as Request).url
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

    render(<ReservationBlock {...baseProps} clientId="client-a" />)
    completeForm()
    submitForm()

    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    })
  })

  it('shows generic error when API JSON parses but error is not SLOT_TAKEN', async () => {
    fetchSpy.mockImplementation((input: RequestInfo) => {
      const url = typeof input === 'string' ? input : (input as Request).url
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

    render(<ReservationBlock {...baseProps} clientId="client-a" />)
    completeForm()
    submitForm()

    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    })
  })
})

describe('ReservationBlock — availability integration', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  it('fetches availability when clientId, service, and date are set', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({ bookedSlots: [] }),
    } as Response)

    render(<ReservationBlock {...baseProps} clientId="rest-pepe" />)
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
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response)

    render(<ReservationBlock {...baseProps} clientId="scoped" />)
    pickService()
    pickDate()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '13:00' })).toBeInTheDocument()
    })
    expect(screen.queryByRole('button', { name: /fully booked/i })).not.toBeInTheDocument()
  })

  it('uses availabilityEndpoint when provided', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({ bookedSlots: [] }),
    } as Response)

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
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({ bookedSlots: [] }),
    } as Response)

    render(<ReservationBlock {...baseProps} clientId="dur-test" />)
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
    fetchSpy.mockImplementation(() => availability)

    render(<ReservationBlock {...baseProps} clientId="x" />)
    pickService()
    pickDate()

    await waitFor(() => {
      expect(screen.getByText(/checking availability/i)).toBeInTheDocument()
    })

    finish({
      ok: true,
      json: async () => ({ bookedSlots: [] }),
    } as Response)

    await waitFor(() => {
      expect(screen.queryByText(/checking availability/i)).not.toBeInTheDocument()
    })
  })

  it('reflects booked slots returned by the availability API', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({ bookedSlots: ['13:00'] }),
    } as Response)

    render(<ReservationBlock {...baseProps} clientId="x" />)
    pickService()
    pickDate()

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /13:00.*fully booked/i }),
      ).toBeInTheDocument()
    })
  })

  it('does not change selection when clicking a booked slot', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({ bookedSlots: ['13:00'] }),
    } as Response)

    render(<ReservationBlock {...baseProps} clientId="x" />)
    pickService()
    pickDate()

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /13:00.*fully booked/i })).toBeInTheDocument(),
    )

    fireEvent.click(screen.getByRole('button', { name: '14:00' }))
    expect(screen.getByRole('button', { name: '14:00' })).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(screen.getByRole('button', { name: /13:00.*fully booked/i }))
    expect(screen.getByRole('button', { name: '14:00' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('treats a non-OK availability response as no booked slots', async () => {
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 500,
    } as Response)

    render(<ReservationBlock {...baseProps} clientId="x" />)
    pickService()
    pickDate()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '13:00' })).toBeInTheDocument()
    })
    expect(screen.queryByRole('button', { name: /fully booked/i })).not.toBeInTheDocument()
  })

  it('recovers with empty booked slots when availability fetch rejects', async () => {
    fetchSpy.mockRejectedValue(new Error('network'))

    render(<ReservationBlock {...baseProps} clientId="x" />)
    pickService()
    pickDate()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '13:00' })).toBeInTheDocument()
    })
  })
})

describe('ReservationBlock — inline field validation', () => {
  beforeEach(() => {
    render(<ReservationBlock {...baseProps} />)
    pickService()
    pickDate()
    pickSlot()
  })

  it('shows the name validation message after blur', async () => {
    const input = document.getElementById('res-name') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'x' } })
    fireEvent.blur(input)

    expect(await screen.findByText(/please enter a full name/i)).toBeInTheDocument()
  })

  it('shows the email validation message after blur', async () => {
    const input = document.getElementById('res-email') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'not-an-email' } })
    fireEvent.blur(input)

    expect(await screen.findByText(/please enter a valid email/i)).toBeInTheDocument()
  })

  it('shows the phone validation message after blur', async () => {
    const input = document.getElementById('res-phone') as HTMLInputElement
    fireEvent.change(input, { target: { value: '123' } })
    fireEvent.blur(input)

    expect(await screen.findByText(/please enter a valid phone number/i)).toBeInTheDocument()
  })
})

describe('ReservationBlock — accessibility', () => {
  it('associates each label with its input via matching htmlFor and id', () => {
    render(<ReservationBlock {...baseProps} />)
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

  it('marks the section with the correct data-component attribute', () => {
    const { container } = render(<ReservationBlock {...baseProps} />)
    const section = container.querySelector('[data-component="reservation-block"]')
    expect(section?.tagName).toBe('SECTION')
  })

  it('does not render a heading element when heading prop is not provided', () => {
    render(<ReservationBlock _type="reservationBlock" subtext="A subtitle" services={SERVICES} />)
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })
})
