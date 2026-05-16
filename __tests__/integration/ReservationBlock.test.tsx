import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import ReservationBlock from '@/components/blocks/ReservationBlock'
import type { ReservationBlock as ReservationBlockProps } from '@/types/cms'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const CUSTOM_SLOTS = ['13:00', '14:00', '20:00', '21:00']

const baseProps: ReservationBlockProps = {
  _type: 'reservationBlock',
  heading: 'Make a Reservation',
  subtext: 'Book your table online.',
  availableTimeSlots: CUSTOM_SLOTS,
  minPartySize: 1,
  maxPartySize: 8,
  confirmationMessage: null,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  partySize = '2',
} = {}) {
  fireEvent.change(document.getElementById('res-name')!, { target: { value: name } })
  fireEvent.change(document.getElementById('res-email')!, { target: { value: email } })
  fireEvent.change(document.getElementById('res-phone')!, { target: { value: phone } })
  fireEvent.change(document.getElementById('res-party')!, { target: { value: partySize } })
}

function submitForm() {
  fireEvent.submit(document.querySelector('form')!)
}

/** Walk through the full happy path up to (but not including) submission. */
function completeForm(overrides?: Parameters<typeof fillGuestDetails>[0]) {
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
    expect(screen.getByText('Book your table online.')).toBeInTheDocument()
  })

  it('does not render a heading or subtext section when both are omitted', () => {
    render(<ReservationBlock _type="reservationBlock" />)
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })

  it('renders only heading when subtext is omitted', () => {
    render(<ReservationBlock _type="reservationBlock" heading="Reserve" />)
    expect(screen.getByRole('heading', { name: 'Reserve' })).toBeInTheDocument()
  })

  it('renders the date input', () => {
    render(<ReservationBlock {...baseProps} />)
    expect(document.getElementById('res-date')).toBeInTheDocument()
  })

  it('does not show time slots before a date is chosen', () => {
    render(<ReservationBlock {...baseProps} />)
    expect(screen.queryByRole('button', { name: CUSTOM_SLOTS[0] })).not.toBeInTheDocument()
  })

  it('does not show guest detail fields before a date is chosen', () => {
    render(<ReservationBlock {...baseProps} />)
    expect(document.getElementById('res-name')).not.toBeInTheDocument()
  })
})

describe('ReservationBlock — step 1 → step 2: date selection reveals time slots', () => {
  it('shows the time slot grid after picking a date', () => {
    render(<ReservationBlock {...baseProps} />)
    pickDate()
    CUSTOM_SLOTS.forEach(slot => {
      expect(screen.getByRole('button', { name: slot })).toBeInTheDocument()
    })
  })

  it('renders custom availableTimeSlots when provided', () => {
    render(<ReservationBlock {...baseProps} availableTimeSlots={['09:00', '10:00']} />)
    pickDate()
    expect(screen.getByRole('button', { name: '09:00' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '10:00' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '13:00' })).not.toBeInTheDocument()
  })

  it('falls back to default slots when availableTimeSlots is null', () => {
    render(<ReservationBlock _type="reservationBlock" availableTimeSlots={null} />)
    pickDate()
    // Spot-check a few default slots
    expect(screen.getByRole('button', { name: '09:00' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '18:00' })).toBeInTheDocument()
  })

  it('falls back to default slots when availableTimeSlots is an empty array', () => {
    render(<ReservationBlock _type="reservationBlock" availableTimeSlots={[]} />)
    pickDate()
    expect(screen.getByRole('button', { name: '09:00' })).toBeInTheDocument()
  })

  it('does not show guest form fields until a time slot is selected', () => {
    render(<ReservationBlock {...baseProps} />)
    pickDate()
    expect(document.getElementById('res-name')).not.toBeInTheDocument()
  })
})

describe('ReservationBlock — step 2 → step 3: time selection reveals guest form', () => {
  it('shows the guest detail fields after picking a time slot', () => {
    render(<ReservationBlock {...baseProps} />)
    pickDate()
    pickSlot()
    expect(document.getElementById('res-name')).toBeInTheDocument()
    expect(document.getElementById('res-email')).toBeInTheDocument()
    expect(document.getElementById('res-phone')).toBeInTheDocument()
    expect(document.getElementById('res-party')).toBeInTheDocument()
    expect(document.getElementById('res-notes')).toBeInTheDocument()
  })

  it('shows the submit button once the guest form is visible', () => {
    render(<ReservationBlock {...baseProps} />)
    pickDate()
    pickSlot()
    expect(screen.getByRole('button', { name: /confirm reservation/i })).toBeInTheDocument()
  })

  it('applies selected styling to the chosen time slot button', () => {
    render(<ReservationBlock {...baseProps} />)
    pickDate()
    const slotBtn = screen.getByRole('button', { name: '13:00' })
    fireEvent.click(slotBtn)
    expect(slotBtn.className).toContain('bg-primary')
  })

  it('changing the date resets time selection and hides guest form', () => {
    render(<ReservationBlock {...baseProps} />)
    pickDate('2026-12-25')
    pickSlot()
    expect(document.getElementById('res-name')).toBeInTheDocument()

    // Change date to a different day
    pickDate('2026-12-26')
    expect(document.getElementById('res-name')).not.toBeInTheDocument()
  })
})

describe('ReservationBlock — guest form constraints', () => {
  beforeEach(() => {
    render(<ReservationBlock {...baseProps} minPartySize={2} maxPartySize={6} />)
    pickDate()
    pickSlot()
  })

  it('shows the correct party size hint text', () => {
    expect(screen.getByText(/between 2 and 6 guests/i)).toBeInTheDocument()
  })

  it('defaults partySize input to minPartySize', () => {
    const input = document.getElementById('res-party') as HTMLInputElement
    expect(input.value).toBe('2')
  })

  it('has the correct min/max attributes on the partySize input', () => {
    const input = document.getElementById('res-party') as HTMLInputElement
    expect(input.min).toBe('2')
    expect(input.max).toBe('6')
  })
})

describe('ReservationBlock — submit button state', () => {
  beforeEach(() => {
    render(<ReservationBlock {...baseProps} />)
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

describe('ReservationBlock — party size boundary validation', () => {
  it('disables submit button when partySize is below min', () => {
    render(<ReservationBlock {...baseProps} minPartySize={2} maxPartySize={8} />)
    pickDate()
    pickSlot()
    fillGuestDetails({ partySize: '1' })
    expect(screen.getByRole('button', { name: /confirm reservation/i })).toBeDisabled()
  })

  it('disables submit button when partySize exceeds max', () => {
    render(<ReservationBlock {...baseProps} minPartySize={1} maxPartySize={4} />)
    pickDate()
    pickSlot()
    fillGuestDetails({ partySize: '10' })
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

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledOnce())

    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/reservation')
    expect(init.method).toBe('POST')

    const body = JSON.parse(init.body as string)
    expect(body).toMatchObject({
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '+34 600 000 000',
      date: '2026-12-25',
      time: '13:00',
      partySize: 2,
    })
  })

  it('trims whitespace from name, email and phone before sending', async () => {
    fetchSpy.mockResolvedValueOnce({ ok: true } as Response)
    render(<ReservationBlock {...baseProps} />)
    completeForm({ name: '  Jane Smith  ', email: ' jane@example.com ', phone: ' +34 600 000 000 ' })
    submitForm()

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledOnce())
    const body = JSON.parse((fetchSpy.mock.calls[0] as [string, RequestInit])[1].body as string)
    expect(body.name).toBe('Jane Smith')
    expect(body.email).toBe('jane@example.com')
    expect(body.phone).toBe('+34 600 000 000')
  })

  it('omits notes from payload when notes field is empty', async () => {
    fetchSpy.mockResolvedValueOnce({ ok: true } as Response)
    render(<ReservationBlock {...baseProps} />)
    completeForm()
    submitForm()

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledOnce())
    const body = JSON.parse((fetchSpy.mock.calls[0] as [string, RequestInit])[1].body as string)
    expect(body.notes).toBeUndefined()
  })

  it('includes notes in payload when filled in', async () => {
    fetchSpy.mockResolvedValueOnce({ ok: true } as Response)
    render(<ReservationBlock {...baseProps} />)
    pickDate()
    pickSlot()
    fillGuestDetails()
    fireEvent.change(document.getElementById('res-notes')!, { target: { value: 'Window seat please' } })
    submitForm()

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledOnce())
    const body = JSON.parse((fetchSpy.mock.calls[0] as [string, RequestInit])[1].body as string)
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
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
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
    pickDate()
    pickSlot()
    // Do NOT fill the guest fields — form is incomplete
    submitForm()
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})

describe('ReservationBlock — accessibility', () => {
  it('associates each label with its input via matching htmlFor and id', () => {
    render(<ReservationBlock {...baseProps} />)
    pickDate()
    pickSlot()

    const labeledIds = ['res-name', 'res-email', 'res-phone', 'res-party', 'res-notes']
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
    render(<ReservationBlock _type="reservationBlock" subtext="A subtitle" />)
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })
})
