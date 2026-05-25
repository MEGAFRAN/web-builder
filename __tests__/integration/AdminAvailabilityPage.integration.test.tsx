import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react'
import AdminAvailabilityPage from '@/components/admin/AdminAvailabilityPage'
import { adminCopy, DAY_LABEL } from '@/components/admin/admin-copy'
import type { BookingScheduleFile, WeeklyHoursRow } from '@/types/admin'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function jsonResponse(data: unknown, ok = true): Response {
  return {
    ok,
    json: async () => data,
  } as Response
}

function fetchInputUrl(input: Parameters<typeof fetch>[0]): string {
  return typeof input === 'string' ? input : input instanceof Request ? input.url : input.href
}

function scheduleCalls(fetchSpy: { mock: { calls: unknown[][] } }) {
  return fetchSpy.mock.calls.filter(
    (c): c is [string, RequestInit | undefined] =>
      Array.isArray(c) && typeof c[0] === 'string' && c[0].startsWith('/api/admin/schedule'),
  )
}

/** Mount queues schedule fetch in a microtask; flush so setState runs inside act. */
async function renderAvailabilityPage() {
  const utils = render(<AdminAvailabilityPage />)
  await act(async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 0))
  })
  return utils
}

async function waitForEditorLoaded() {
  await waitFor(() => {
    expect(screen.getByRole('heading', { name: adminCopy.availability.weeklyHours })).toBeInTheDocument()
  })
  expect(screen.queryByText(adminCopy.common.loading)).not.toBeInTheDocument()
}

function mockScheduleFetch(
  schedule: BookingScheduleFile,
  services: unknown[] = [],
  handlers?: (url: string, init?: RequestInit) => Response | Promise<Response> | undefined,
) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
    const url = fetchInputUrl(input)
    const override = handlers?.(url, init)
    if (override) return Promise.resolve(override)

    if (url.includes('/api/admin/services')) {
      return Promise.resolve(jsonResponse({ services }))
    }
    if (url.startsWith('/api/admin/schedule')) {
      return Promise.resolve(jsonResponse(schedule))
    }
    return Promise.reject(new Error(`Unexpected fetch: ${url}`))
  })
}

vi.mock('next/link', () => ({
  default ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode
    href: string
    [key: string]: unknown
  }) {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    )
  },
}))

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AdminAvailabilityPage', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    fetchSpy = mockScheduleFetch(makeSchedule())
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  describe('initial load', () => {
    it('loads schedule and services in parallel and renders the weekly editor', async () => {
      fetchSpy.mockRestore()
      fetchSpy = mockScheduleFetch(makeSchedule(), [{ id: 'svc-a' }, { id: 'svc-b' }])

      await renderAvailabilityPage()
      await waitForEditorLoaded()

      expect(fetch).toHaveBeenCalledWith('/api/admin/schedule', { credentials: 'include' })
      expect(fetch).toHaveBeenCalledWith('/api/admin/services', { credentials: 'include' })
      expect(screen.getByRole('heading', { name: adminCopy.availability.heading })).toBeInTheDocument()
      expect(screen.getByText(DAY_LABEL.mon)).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /activo en: 2 servicios/i })).toHaveAttribute(
        'href',
        '/admin/services',
      )
    })

    it('shows an error alert when the schedule request fails', async () => {
      fetchSpy.mockRestore()
      fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({}, false))

      await renderAvailabilityPage()

      await waitFor(() => {
        expect(screen.getByText(adminCopy.common.error)).toBeInTheDocument()
        expect(screen.getByText(adminCopy.availability.errors.failedLoad)).toBeInTheDocument()
      })
    })
  })

  describe('weekly hours', () => {
    it('edits day times, saves with PUT, and shows success status', async () => {
      fetchSpy.mockRestore()
      const schedule = makeSchedule()
      fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
        const url = fetchInputUrl(input)
        if (url.includes('/api/admin/services')) {
          return Promise.resolve(jsonResponse({ services: [] }))
        }
        if (url.startsWith('/api/admin/schedule') && init?.method === 'PUT') {
          const body = JSON.parse(String(init.body)) as { weekly: WeeklyHoursRow[] }
          const mon = body.weekly.find((row) => row.day === 'mon')
          expect(mon).toMatchObject({ open: true, from: '10:00', to: '14:00' })
          return Promise.resolve(
            jsonResponse({
              schedule: {
                ...schedule,
                weekly: body.weekly,
              },
            }),
          )
        }
        return Promise.resolve(jsonResponse(schedule))
      })

      await renderAvailabilityPage()
      await waitForEditorLoaded()

      fireEvent.change(document.getElementById('from-mon')!, { target: { value: '10:00' } })
      fireEvent.change(document.getElementById('to-mon')!, { target: { value: '14:00' } })
      fireEvent.click(screen.getByRole('button', { name: adminCopy.availability.saveSchedule }))

      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent(adminCopy.availability.scheduleSaved)
      })

      const putCalls = scheduleCalls(fetchSpy).filter(([, init]) => init?.method === 'PUT')
      expect(putCalls).toHaveLength(1)
      expect(putCalls[0][1]).toMatchObject({
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })
    })

    it('enables a closed day and persists when saved', async () => {
      fetchSpy.mockRestore()
      const schedule = makeSchedule()
      fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
        const url = fetchInputUrl(input)
        if (url.includes('/api/admin/services')) {
          return Promise.resolve(jsonResponse({ services: [] }))
        }
        if (url.startsWith('/api/admin/schedule') && init?.method === 'PUT') {
          const body = JSON.parse(String(init.body)) as { weekly: WeeklyHoursRow[] }
          const sun = body.weekly.find((row) => row.day === 'sun')
          expect(sun).toMatchObject({ open: true, from: '09:00', to: '17:00' })
          return Promise.resolve(jsonResponse({ schedule: { ...schedule, weekly: body.weekly } }))
        }
        return Promise.resolve(jsonResponse(schedule))
      })

      await renderAvailabilityPage()
      await waitForEditorLoaded()

      fireEvent.click(screen.getByRole('button', { name: adminCopy.availability.addHoursAria(DAY_LABEL.sun) }))
      expect(document.getElementById('from-sun')).toHaveValue('09:00')
      expect(document.getElementById('to-sun')).toHaveValue('17:00')

      fireEvent.click(screen.getByRole('button', { name: adminCopy.availability.saveSchedule }))

      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent(adminCopy.availability.scheduleSaved)
      })
    })

    it('copies hours from one day to others before saving', async () => {
      fetchSpy.mockRestore()
      const schedule = makeSchedule()
      fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
        const url = fetchInputUrl(input)
        if (url.includes('/api/admin/services')) {
          return Promise.resolve(jsonResponse({ services: [] }))
        }
        if (url.startsWith('/api/admin/schedule') && init?.method === 'PUT') {
          const body = JSON.parse(String(init.body)) as { weekly: WeeklyHoursRow[] }
          expect(body.weekly.find((row) => row.day === 'tue')).toMatchObject({
            open: true,
            from: '08:30',
            to: '12:30',
          })
          expect(body.weekly.find((row) => row.day === 'wed')).toMatchObject({
            open: true,
            from: '08:30',
            to: '12:30',
          })
          return Promise.resolve(jsonResponse({ schedule: { ...schedule, weekly: body.weekly } }))
        }
        return Promise.resolve(jsonResponse(schedule))
      })

      await renderAvailabilityPage()
      await waitForEditorLoaded()

      fireEvent.change(document.getElementById('from-mon')!, { target: { value: '08:30' } })
      fireEvent.change(document.getElementById('to-mon')!, { target: { value: '12:30' } })
      fireEvent.click(
        screen.getByRole('button', { name: `Copiar el horario de ${DAY_LABEL.mon} a otros días` }),
      )

      const dialog = await screen.findByRole('dialog')
      fireEvent.click(within(dialog).getByRole('checkbox', { name: DAY_LABEL.tue }))
      fireEvent.click(within(dialog).getByRole('checkbox', { name: DAY_LABEL.wed }))
      fireEvent.click(within(dialog).getByRole('button', { name: 'Aplicar a 2 días' }))

      expect(document.getElementById('from-tue')).toHaveValue('08:30')
      expect(document.getElementById('to-wed')).toHaveValue('12:30')

      fireEvent.click(screen.getByRole('button', { name: adminCopy.availability.saveSchedule }))

      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent(adminCopy.availability.scheduleSaved)
      })
    })

    it('shows save errors when PUT is rejected', async () => {
      fetchSpy.mockRestore()
      const schedule = makeSchedule()
      fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
        const url = fetchInputUrl(input)
        if (url.includes('/api/admin/services')) {
          return Promise.resolve(jsonResponse({ services: [] }))
        }
        if (url.startsWith('/api/admin/schedule') && init?.method === 'PUT') {
          return Promise.resolve(jsonResponse({ error: 'cannot save' }, false))
        }
        return Promise.resolve(jsonResponse(schedule))
      })

      await renderAvailabilityPage()
      await waitForEditorLoaded()

      fireEvent.click(screen.getByRole('button', { name: adminCopy.availability.saveSchedule }))

      await waitFor(() => {
        expect(screen.getByText('cannot save')).toBeInTheDocument()
      })
    })
  })

  describe('date-specific hours', () => {
    it('adds a closed exception via POST and updates the list', async () => {
      fetchSpy.mockRestore()
      const schedule = makeSchedule()
      const nextSchedule = makeSchedule({
        exceptions: [{ id: 'ex-closed', date: '2026-10-01', closed: true }],
      })
      fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
        const url = fetchInputUrl(input)
        if (url.includes('/api/admin/services')) {
          return Promise.resolve(jsonResponse({ services: [] }))
        }
        if (url === '/api/admin/schedule' && init?.method === 'POST') {
          expect(JSON.parse(String(init.body))).toEqual({ date: '2026-10-01', closed: true })
          return Promise.resolve(jsonResponse({ schedule: nextSchedule }))
        }
        return Promise.resolve(jsonResponse(schedule))
      })

      await renderAvailabilityPage()
      await waitForEditorLoaded()

      fireEvent.click(screen.getByRole('button', { name: adminCopy.availability.addHoursButton }))
      const dialog = await screen.findByRole('dialog')
      fireEvent.change(within(dialog).getByLabelText(adminCopy.availability.date), {
        target: { value: '2026-10-01' },
      })
      fireEvent.click(within(dialog).getByRole('button', { name: adminCopy.availability.saveException }))

      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: adminCopy.availability.addException })).not.toBeInTheDocument()
      })

      const exSection = screen.getByRole('heading', { name: adminCopy.availability.dateSpecificHours }).closest('section')
      expect(exSection).not.toBeNull()
      expect(within(exSection as HTMLElement).getByText(adminCopy.availability.closed)).toBeInTheDocument()
    })

    it('adds a custom-hours exception with from/to in the POST body', async () => {
      fetchSpy.mockRestore()
      const schedule = makeSchedule()
      const nextSchedule = makeSchedule({
        exceptions: [{ id: 'ex-custom', date: '2026-11-02', closed: false, from: '12:00', to: '16:00' }],
      })
      fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
        const url = fetchInputUrl(input)
        if (url.includes('/api/admin/services')) {
          return Promise.resolve(jsonResponse({ services: [] }))
        }
        if (url === '/api/admin/schedule' && init?.method === 'POST') {
          expect(JSON.parse(String(init.body))).toMatchObject({
            date: '2026-11-02',
            closed: false,
            from: '12:00',
            to: '16:00',
          })
          return Promise.resolve(jsonResponse({ schedule: nextSchedule }))
        }
        return Promise.resolve(jsonResponse(schedule))
      })

      await renderAvailabilityPage()
      await waitForEditorLoaded()

      fireEvent.click(screen.getByRole('button', { name: adminCopy.availability.addHoursButton }))
      const dialog = await screen.findByRole('dialog')
      fireEvent.change(within(dialog).getByLabelText(adminCopy.availability.date), {
        target: { value: '2026-11-02' },
      })
      fireEvent.click(within(dialog).getByRole('radio', { name: adminCopy.availability.customHours }))
      fireEvent.change(within(dialog).getByLabelText(adminCopy.availability.from), {
        target: { value: '12:00' },
      })
      fireEvent.change(within(dialog).getByLabelText(adminCopy.availability.to), {
        target: { value: '16:00' },
      })
      fireEvent.click(within(dialog).getByRole('button', { name: adminCopy.availability.saveException }))

      await waitFor(() => {
        expect(screen.getByText(/12:00 – 16:00/)).toBeInTheDocument()
      })
    })

    it('removes an exception via DELETE', async () => {
      fetchSpy.mockRestore()
      const schedule = makeSchedule({
        exceptions: [
          { id: 'ex1', date: '2026-08-10', closed: true },
          { id: 'ex2', date: '2026-08-11', closed: false, from: '11:00', to: '15:00' },
        ],
      })
      const afterDelete = makeSchedule({ exceptions: schedule.exceptions.slice(1) })
      fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
        const url = fetchInputUrl(input)
        if (url.includes('/api/admin/services')) {
          return Promise.resolve(jsonResponse({ services: [] }))
        }
        if (url.includes('id=ex1') && init?.method === 'DELETE') {
          return Promise.resolve(jsonResponse({ schedule: afterDelete }))
        }
        return Promise.resolve(jsonResponse(schedule))
      })

      await renderAvailabilityPage()
      await waitForEditorLoaded()

      const exSection = screen.getByRole('heading', { name: adminCopy.availability.dateSpecificHours }).closest('section')
      expect(exSection).not.toBeNull()

      fireEvent.click(
        screen.getByRole('button', { name: adminCopy.availability.removeExceptionAria('2026-08-10') }),
      )

      await waitFor(() => {
        expect(within(exSection as HTMLElement).getAllByRole('listitem')).toHaveLength(1)
      })
      expect(fetch).toHaveBeenCalledWith(
        '/api/admin/schedule?id=ex1',
        expect.objectContaining({ method: 'DELETE', credentials: 'include' }),
      )
    })
  })

  describe('schedule menu', () => {
    it('reloads schedule data from the kebab menu', async () => {
      await renderAvailabilityPage()
      await waitForEditorLoaded()

      const initialCalls = scheduleCalls(fetchSpy).length
      fireEvent.click(screen.getByRole('button', { name: 'Opciones del horario' }))
      fireEvent.click(screen.getByRole('menuitem', { name: 'Recargar horario' }))

      await waitFor(() => {
        expect(scheduleCalls(fetchSpy).length).toBeGreaterThan(initialCalls)
      })
    })
  })
})
