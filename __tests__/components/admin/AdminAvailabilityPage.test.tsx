import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import AdminAvailabilityPage from '@/components/admin/AdminAvailabilityPage'
import type { BookingScheduleFile } from '@/types/admin'
import { adminCopy, DAY_LABEL } from '@/components/admin/admin-copy'

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

function fetchJsonSuccess(body: unknown) {
  return Promise.resolve({
    ok: true,
    json: async () => body,
  })
}

function stubFetchWithSchedule(
  schedule: BookingScheduleFile,
  extra?: (input: string, init?: RequestInit) => ReturnType<typeof fetch> | undefined,
) {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString()
      const override = extra?.(url, init)
      if (override) return override
      if (url.includes('/api/admin/services')) {
        return fetchJsonSuccess({ services: [] })
      }
      return fetchJsonSuccess(schedule)
    }),
  )
}

function makeSchedule(overrides: Partial<BookingScheduleFile> = {}): BookingScheduleFile {
  const weekly = DAYS.map((day) => ({
    day,
    open: day !== 'sun',
    from: '09:00',
    to: '18:00',
  }))
  return {
    weekly,
    exceptions: [],
    ...overrides,
  }
}

describe('AdminAvailabilityPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('loads the schedule from the API and renders the weekly editor', async () => {
    const schedule = makeSchedule()
    stubFetchWithSchedule(schedule)

    render(<AdminAvailabilityPage />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: adminCopy.availability.weeklyHours })).toBeInTheDocument()
    })

    expect(fetch).toHaveBeenCalledWith('/api/admin/schedule')
    expect(fetch).toHaveBeenCalledWith('/api/admin/services')
    expect(screen.getByText(DAY_LABEL.mon)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: adminCopy.availability.saveSchedule })).toBeInTheDocument()
  })

  it('shows an error alert when the schedule request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: false,
          json: async () => ({}),
        }),
      ),
    )

    render(<AdminAvailabilityPage />)

    await waitFor(() => {
      expect(screen.getByText(adminCopy.common.error)).toBeInTheDocument()
    })
    expect(screen.getByText(adminCopy.availability.errors.failedLoad)).toBeInTheDocument()
  })

  it('persists weekly edits with PUT /api/admin/schedule', async () => {
    const schedule = makeSchedule()
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url.startsWith('/api/admin/schedule') && init?.method === 'PUT') {
        const body = JSON.parse(String(init.body)) as { weekly: unknown }
        return Promise.resolve({
          ok: true,
          json: async () => ({ schedule: { ...schedule, weekly: body.weekly } }),
        })
      }
      if (url.includes('/api/admin/services')) {
        return fetchJsonSuccess({ services: [] })
      }
      return Promise.resolve({
        ok: true,
        json: async () => schedule,
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<AdminAvailabilityPage />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: adminCopy.availability.weeklyHours })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: adminCopy.availability.removeHoursAria(DAY_LABEL.mon) }))

    fireEvent.click(screen.getByRole('button', { name: adminCopy.availability.saveSchedule }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/schedule',
        expect.objectContaining({
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
        }),
      )
    })

    const putCall = fetchMock.mock.calls.find((c) => c[1]?.method === 'PUT')
    expect(putCall).toBeDefined()
    const init = putCall?.[1]
    if (!init?.body) throw new Error('expected PUT body')
    const weekly = JSON.parse(String(init.body)).weekly as { day: string; open: boolean }[]
    const mon = weekly.find((r) => r.day === 'mon')
    expect(mon?.open).toBe(false)
  })

  it('opens the add-exception modal from the toolbar control', async () => {
    const schedule = makeSchedule()
    stubFetchWithSchedule(schedule)

    render(<AdminAvailabilityPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: adminCopy.availability.addHoursButton })).toBeEnabled()
    })

    fireEvent.click(screen.getByRole('button', { name: adminCopy.availability.addHoursButton }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: adminCopy.availability.addException })).toBeInTheDocument()
    })
  })

  it('renders exception labels and removes an exception via DELETE', async () => {
    const schedule = makeSchedule({
      exceptions: [
        { id: 'ex1', date: '2026-08-10', closed: true },
        { id: 'ex2', date: '2026-08-11', closed: false, from: '11:00', to: '15:00' },
      ],
    })
    const afterDelete = makeSchedule({ exceptions: schedule.exceptions.slice(1) })
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url.includes('id=ex1') && init?.method === 'DELETE') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ schedule: afterDelete }),
        })
      }
      if (url.includes('/api/admin/services')) {
        return fetchJsonSuccess({ services: [] })
      }
      return Promise.resolve({
        ok: true,
        json: async () => schedule,
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<AdminAvailabilityPage />)

    const exHeading = await screen.findByRole('heading', { name: adminCopy.availability.dateSpecificHours })
    const exSection = exHeading.closest('section')
    expect(exSection).not.toBeNull()

    await waitFor(() => {
      expect(within(exSection as HTMLElement).getByText(adminCopy.availability.closed)).toBeInTheDocument()
      expect(screen.getByText(/11:00 – 15:00/)).toBeInTheDocument()
    })

    fireEvent.click(
      screen.getByRole('button', { name: adminCopy.availability.removeExceptionAria('2026-08-10') }),
    )

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/schedule?id=ex1',
        expect.objectContaining({ method: 'DELETE' }),
      )
    })
    await waitFor(() => {
      expect(within(exSection as HTMLElement).getAllByRole('listitem')).toHaveLength(1)
    })
  })

  it('shows a top-level error when exception deletion fails', async () => {
    const schedule = makeSchedule({
      exceptions: [{ id: 'bad', date: '2026-09-01', closed: true }],
    })
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url.includes('/api/admin/schedule') && init?.method === 'DELETE') {
        return Promise.resolve({
          ok: false,
          json: async () => ({ error: 'blocked delete' }),
        })
      }
      if (url.includes('/api/admin/services')) {
        return fetchJsonSuccess({ services: [] })
      }
      return Promise.resolve({ ok: true, json: async () => schedule })
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<AdminAvailabilityPage />)

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: adminCopy.availability.removeExceptionAria('2026-09-01') }),
      ).toBeInTheDocument()
    })

    fireEvent.click(
      screen.getByRole('button', { name: adminCopy.availability.removeExceptionAria('2026-09-01') }),
    )

    await waitFor(() => {
      expect(screen.getByText('blocked delete')).toBeInTheDocument()
    })
  })

  it('shows weekly save errors when PUT is rejected', async () => {
    const schedule = makeSchedule()
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url.startsWith('/api/admin/schedule') && init?.method === 'PUT') {
        return Promise.resolve({
          ok: false,
          json: async () => ({ error: 'cannot save' }),
        })
      }
      if (url.includes('/api/admin/services')) {
        return fetchJsonSuccess({ services: [] })
      }
      return Promise.resolve({ ok: true, json: async () => schedule })
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<AdminAvailabilityPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: adminCopy.availability.saveSchedule })).toBeEnabled()
    })

    fireEvent.click(screen.getByRole('button', { name: adminCopy.availability.saveSchedule }))

    await waitFor(() => {
      expect(screen.getByText('cannot save')).toBeInTheDocument()
    })
  })

  it('submits a closed exception and handles POST errors', async () => {
    const schedule = makeSchedule()
    const nextSchedule = makeSchedule({
      exceptions: [{ id: 'new-ex', date: '2026-10-01', closed: true }],
    })
    let postCalls = 0
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url === '/api/admin/schedule' && init?.method === 'POST') {
        postCalls += 1
        if (postCalls === 1) {
          return Promise.resolve({
            ok: false,
            json: async () => ({ error: 'bad date' }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ schedule: nextSchedule }),
        })
      }
      if (url.includes('/api/admin/services')) {
        return fetchJsonSuccess({ services: [] })
      }
      return Promise.resolve({ ok: true, json: async () => schedule })
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<AdminAvailabilityPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: adminCopy.availability.addHoursButton })).toBeEnabled()
    })

    fireEvent.click(screen.getByRole('button', { name: adminCopy.availability.addHoursButton }))

    const dlg = await screen.findByRole('dialog')
    fireEvent.change(within(dlg).getByLabelText(adminCopy.availability.date), {
      target: { value: '2026-10-01' },
    })
    fireEvent.click(within(dlg).getByRole('button', { name: adminCopy.availability.saveException }))

    await waitFor(() => {
      expect(screen.getByText('bad date')).toBeInTheDocument()
    })

    fireEvent.click(within(dlg).getByRole('button', { name: adminCopy.availability.saveException }))

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: adminCopy.availability.addException })).not.toBeInTheDocument()
    })
  })

  it('saves custom-hour exceptions including from/to in the POST body', async () => {
    const schedule = makeSchedule()
    const nextSchedule = makeSchedule({
      exceptions: [{ id: 'c1', date: '2026-11-02', closed: false, from: '12:00', to: '16:00' }],
    })
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url === '/api/admin/schedule' && init?.method === 'POST') {
        const body = JSON.parse(String(init.body)) as Record<string, unknown>
        expect(body).toMatchObject({
          date: '2026-11-02',
          closed: false,
          from: '12:00',
          to: '16:00',
        })
        return Promise.resolve({
          ok: true,
          json: async () => ({ schedule: nextSchedule }),
        })
      }
      if (url.includes('/api/admin/services')) {
        return fetchJsonSuccess({ services: [] })
      }
      return Promise.resolve({ ok: true, json: async () => schedule })
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<AdminAvailabilityPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: adminCopy.availability.addHoursButton })).toBeEnabled()
    })

    fireEvent.click(screen.getByRole('button', { name: adminCopy.availability.addHoursButton }))

    const dlg = await screen.findByRole('dialog')
    fireEvent.change(within(dlg).getByLabelText(adminCopy.availability.date), {
      target: { value: '2026-11-02' },
    })
    fireEvent.click(within(dlg).getByRole('radio', { name: adminCopy.availability.customHours }))
    fireEvent.change(within(dlg).getByLabelText(adminCopy.availability.from), {
      target: { value: '12:00' },
    })
    fireEvent.change(within(dlg).getByLabelText(adminCopy.availability.to), {
      target: { value: '16:00' },
    })
    fireEvent.click(within(dlg).getByRole('button', { name: adminCopy.availability.saveException }))

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: adminCopy.availability.addException })).not.toBeInTheDocument()
    })
  })
})
