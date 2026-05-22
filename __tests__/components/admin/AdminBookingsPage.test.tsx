import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import AdminBookingsPage from '@/components/admin/AdminBookingsPage'
import type { BookingScheduleFile } from '@/types/admin'
import { adminCopy, WEEK_SHORT_LABELS, weekDayHeader } from '@/components/admin/admin-copy'

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

function makeSchedule(
  options: { monOpen?: boolean; sunOpen?: boolean } = {},
): BookingScheduleFile {
  const { monOpen = true, sunOpen = false } = options
  const weekly = DAYS.map((day) => ({
    day,
    open:
      day === 'mon'
        ? monOpen
        : day === 'sun'
          ? sunOpen
          : true,
    from: '09:00',
    to: '18:00',
  }))
  return { weekly, exceptions: [] }
}

type TestReservation = {
  id: string
  clientId: string
  serviceId?: string
  durationMinutes?: number
  name: string
  email: string
  phone: string
  date: string
  time: string
  notes?: string | null
  status: string
  createdAt: string
  serviceName: string | null
}

function reservation(overrides: Partial<TestReservation> = {}): TestReservation {
  return {
    id: 'r1',
    clientId: 'client-1',
    name: 'Pat Guest',
    email: 'pat@example.com',
    phone: '111',
    date: '2026-05-18',
    time: '10:00',
    status: 'confirmed',
    createdAt: '2026-01-01T00:00:00Z',
    serviceName: 'Cut',
    ...overrides,
  }
}

describe('AdminBookingsPage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(new Date('2026-05-18T12:00:00'))
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows a loading state until reservation and schedule requests settle', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise<Response>(() => {
            /* never resolves */
          }),
      ),
    )

    render(<AdminBookingsPage clientId="client-1" />)

    expect(screen.getByText(adminCopy.common.loading)).toBeInTheDocument()
  })

  it('requests the selected day range and renders the empty-day affordance when no bookings exist', async () => {
    const schedule = makeSchedule()
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString()
        if (url.includes('/api/admin/reservations')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ reservations: [] }),
          } as Response)
        }
        if (url.includes('/api/admin/schedule')) {
          return Promise.resolve({
            ok: true,
            json: async () => schedule,
          } as Response)
        }
        return Promise.reject(new Error(`unexpected fetch ${url}`))
      }),
    )

    render(<AdminBookingsPage clientId="client-1" />)

    await waitFor(() => {
      expect(screen.getByText(adminCopy.bookings.emptyDay)).toBeInTheDocument()
    })

    expect(fetch).toHaveBeenCalledWith(
      '/api/admin/reservations?startDate=2026-05-18&endDate=2026-05-18',
    )
    expect(fetch).toHaveBeenCalledWith('/api/admin/schedule')
  })

  it('surfaces an error alert when reservations cannot be loaded', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString()
        if (url.includes('/api/admin/reservations')) {
          return Promise.resolve({
            ok: false,
            json: async () => ({}),
          } as Response)
        }
        if (url.includes('/api/admin/schedule')) {
          return Promise.resolve({
            ok: true,
            json: async () => makeSchedule(),
          } as Response)
        }
        return Promise.reject(new Error(`unexpected fetch ${url}`))
      }),
    )

    render(<AdminBookingsPage clientId="client-1" />)

    await waitFor(() => {
      expect(screen.getByText(adminCopy.common.error)).toBeInTheDocument()
    })
    expect(screen.getByText(adminCopy.bookings.errors.failedReservations)).toBeInTheDocument()
  })

  it('loads week-wide data when switching to week mode', async () => {
    const schedule = makeSchedule()
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString()
        if (url.includes('/api/admin/reservations')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ reservations: [] }),
          } as Response)
        }
        if (url.includes('/api/admin/schedule')) {
          return Promise.resolve({
            ok: true,
            json: async () => schedule,
          } as Response)
        }
        return Promise.reject(new Error(`unexpected fetch ${url}`))
      }),
    )

    render(<AdminBookingsPage clientId="client-1" />)

    await waitFor(() => {
      expect(screen.queryByText(adminCopy.common.loading)).not.toBeInTheDocument()
    })

    vi.mocked(fetch).mockClear()

    fireEvent.click(screen.getByRole('button', { name: adminCopy.calendar.week }))

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/admin/reservations?startDate=2026-05-18&endDate=2026-05-24',
      )
    })
  })

  it('shows schedule load errors when reservations succeed but the schedule request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString()
        if (url.includes('/api/admin/reservations')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ reservations: [] }),
          } as Response)
        }
        if (url.includes('/api/admin/schedule')) {
          return Promise.resolve({
            ok: false,
            json: async () => ({}),
          } as Response)
        }
        return Promise.reject(new Error(`unexpected fetch ${url}`))
      }),
    )

    render(<AdminBookingsPage clientId="client-1" />)

    await waitFor(() => {
      expect(screen.getByText(adminCopy.bookings.errors.failedSchedule)).toBeInTheDocument()
    })
  })

  it('shows the closed-day state on Sunday when the venue is closed and there are no bookings', async () => {
    vi.setSystemTime(new Date('2026-05-17T12:00:00'))
    const schedule = makeSchedule({ sunOpen: false })
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString()
        if (url.includes('/api/admin/reservations')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ reservations: [] }),
          } as Response)
        }
        if (url.includes('/api/admin/schedule')) {
          return Promise.resolve({
            ok: true,
            json: async () => schedule,
          } as Response)
        }
        return Promise.reject(new Error(`unexpected fetch ${url}`))
      }),
    )

    render(<AdminBookingsPage clientId="client-1" />)

    await waitFor(() => {
      expect(screen.getByText(new RegExp(adminCopy.bookings.closedPrefix, 'i'))).toBeInTheDocument()
    })
    expect(screen.getByText(adminCopy.bookings.closedNoBookings)).toBeInTheDocument()
  })

  it('lists appointments without a timeline when the working-day window is unavailable but bookings exist', async () => {
    const schedule = makeSchedule({ monOpen: false })
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString()
        if (url.includes('/api/admin/reservations')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ reservations: [reservation()] }),
          } as Response)
        }
        if (url.includes('/api/admin/schedule')) {
          return Promise.resolve({
            ok: true,
            json: async () => schedule,
          } as Response)
        }
        return Promise.reject(new Error(`unexpected fetch ${url}`))
      }),
    )

    render(<AdminBookingsPage clientId="client-1" />)

    await waitFor(() => {
      expect(screen.getByText(adminCopy.bookings.specialDayListNote)).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /pat guest/i })).toBeInTheDocument()
  })

  it('opens the day timeline, surfaces detail actions, and completes a cancellation flow', async () => {
    const schedule = makeSchedule()
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString()
        if (url.startsWith('/api/admin/reservations/') && init?.method === 'PATCH') {
          return Promise.resolve({
            ok: true,
            json: async () => ({}),
          } as Response)
        }
        if (url.includes('/api/admin/reservations?')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ reservations: [reservation()] }),
          } as Response)
        }
        if (url.includes('/api/admin/schedule')) {
          return Promise.resolve({
            ok: true,
            json: async () => schedule,
          } as Response)
        }
        return Promise.reject(new Error(`unexpected fetch ${url}`))
      }),
    )

    render(<AdminBookingsPage clientId="client-1" />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /pat guest/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /pat guest/i }))

    const panel = await screen.findByRole('heading', { name: adminCopy.bookings.appointment })
    expect(panel).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: adminCopy.bookings.cancelAppointment }))

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: adminCopy.bookings.cancelModalTitle }),
      ).toBeInTheDocument()
    })

    fireEvent.change(screen.getByPlaceholderText('p. ej., El cliente pidió cancelar'), {
      target: { value: 'Test reason' },
    })
    fireEvent.click(screen.getByRole('button', { name: adminCopy.bookings.confirmCancel }))

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/admin/reservations/r1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ action: 'cancel', reason: 'Test reason' }),
        }),
      )
    })
  })

  it('marks an appointment as no-show from the detail sheet', async () => {
    const schedule = makeSchedule()
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString()
        if (url.startsWith('/api/admin/reservations/') && init?.method === 'PATCH') {
          return Promise.resolve({
            ok: true,
            json: async () => ({}),
          } as Response)
        }
        if (url.includes('/api/admin/reservations?')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ reservations: [reservation()] }),
          } as Response)
        }
        if (url.includes('/api/admin/schedule')) {
          return Promise.resolve({
            ok: true,
            json: async () => schedule,
          } as Response)
        }
        return Promise.reject(new Error(`unexpected fetch ${url}`))
      }),
    )

    render(<AdminBookingsPage clientId="client-1" />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /pat guest/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /pat guest/i }))
    await screen.findByRole('heading', { name: adminCopy.bookings.appointment })

    fireEvent.click(screen.getByRole('button', { name: adminCopy.bookings.markNoShow }))

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/admin/reservations/r1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ action: 'no-show' }),
        }),
      )
    })
  })

  it('jumps from week view into day view when a column header is picked', async () => {
    const schedule = makeSchedule()
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL) => {
        const url = typeof input === 'string' ? input : input.toString()
        if (url.includes('/api/admin/reservations')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ reservations: [] }),
          } as Response)
        }
        if (url.includes('/api/admin/schedule')) {
          return Promise.resolve({
            ok: true,
            json: async () => schedule,
          } as Response)
        }
        return Promise.reject(new Error(`unexpected fetch ${url}`))
      }),
    )

    render(<AdminBookingsPage clientId="client-1" />)

    await waitFor(() => {
      expect(screen.queryByText(adminCopy.common.loading)).not.toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: adminCopy.calendar.week }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: weekDayHeader(WEEK_SHORT_LABELS[0], '18') })).toBeInTheDocument()
    })

    vi.mocked(fetch).mockClear()

    fireEvent.click(screen.getByRole('button', { name: weekDayHeader(WEEK_SHORT_LABELS[3], '21') }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: adminCopy.calendar.day })).toHaveAttribute(
        'aria-pressed',
        'true',
      )
    })
    expect(fetch).toHaveBeenCalledWith(
      '/api/admin/reservations?startDate=2026-05-21&endDate=2026-05-21',
    )
  })

  it('creates an appointment from the modal when the form submits successfully', async () => {
    const schedule = makeSchedule()
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url === '/api/admin/reservations' && init?.method === 'POST') {
        return Promise.resolve({ ok: true, json: async () => ({}) } as Response)
      }
      if (url.includes('/api/availability')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ bookedSlots: [] }),
        } as Response)
      }
      if (url.includes('/api/admin/services') && !url.includes('schedule')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            services: [{ id: 's1', name: 'Trim', durationMinutes: 60 }],
          }),
        } as Response)
      }
      if (url.includes('/api/admin/reservations?')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ reservations: [] }),
        } as Response)
      }
      if (url.includes('/api/admin/schedule')) {
        return Promise.resolve({
          ok: true,
          json: async () => schedule,
        } as Response)
      }
      return Promise.reject(new Error(`unexpected fetch ${url}`))
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<AdminBookingsPage clientId="client-1" />)

    await waitFor(() => {
      expect(screen.getByText(adminCopy.bookings.emptyDay)).toBeInTheDocument()
    })

    fireEvent.click(screen.getAllByRole('button', { name: adminCopy.bookings.newAppointmentButton })[0])

    const modal = await screen.findByRole('heading', { name: adminCopy.appointmentForm.title })
    expect(modal).toBeInTheDocument()

    const dlg = screen.getByRole('dialog')

    await waitFor(() => {
      expect(
        within(dlg).getByRole('option', { name: /trim/i }),
      ).toBeInTheDocument()
    })

    fireEvent.change(within(dlg).getByLabelText(adminCopy.appointmentForm.customerName), {
      target: { value: 'New Client' },
    })
    fireEvent.change(within(dlg).getByLabelText(adminCopy.appointmentForm.phone), {
      target: { value: '999' },
    })
    fireEvent.change(within(dlg).getByLabelText(adminCopy.appointmentForm.email), {
      target: { value: 'n@e.co' },
    })
    fireEvent.change(within(dlg).getByLabelText(adminCopy.appointmentForm.time), {
      target: { value: '09:00' },
    })

    fireEvent.click(within(dlg).getByRole('button', { name: adminCopy.common.save }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/reservations',
        expect.objectContaining({
          method: 'POST',
        }),
      )
    })

    const postCall = fetchMock.mock.calls.find(
      (c) =>
        typeof c[0] === 'string' &&
        c[0] === '/api/admin/reservations' &&
        (c[1] as RequestInit)?.method === 'POST',
    )
    expect(postCall).toBeDefined()
    const body = JSON.parse(String(postCall![1]!.body))
    expect(body).toMatchObject({
      name: 'New Client',
      phone: '999',
      email: 'n@e.co',
      time: '09:00',
      serviceId: 's1',
    })
  })
})
