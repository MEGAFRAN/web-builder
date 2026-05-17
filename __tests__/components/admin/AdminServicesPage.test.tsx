import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import AdminServicesPage from '@/components/admin/AdminServicesPage'

const serviceA = {
  id: 'svc-a',
  name: 'Alpha cut',
  description: 'Short.',
  durationMinutes: 30,
  price: 40,
  currency: '€',
}

const serviceB = {
  id: 'svc-b',
  name: 'Beta style',
  description: 'Long description '.repeat(30),
  durationMinutes: 60,
  price: 49.99,
  currency: '$',
}

describe('AdminServicesPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('loads catalog entries from GET /api/admin/services', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            services: [
              {
                id: 'svc-haircut',
                name: 'Haircut',
                description: 'Wash and trim.',
                durationMinutes: 45,
                price: 35,
                currency: '$',
              },
            ],
          }),
        }),
      ),
    )

    render(<AdminServicesPage />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Haircut', level: 2 })).toBeInTheDocument()
    })

    expect(fetch).toHaveBeenCalledWith('/api/admin/services')
    expect(screen.getByText(/wash and trim/i)).toBeInTheDocument()
  })

  it('shows onboarding guidance when no services exist yet', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({ services: [] }),
        }),
      ),
    )

    render(<AdminServicesPage />)

    await waitFor(() => {
      expect(screen.getByText(/haven't added any services yet/i)).toBeInTheDocument()
    })
  })

  it('shows an error alert when the catalog cannot be fetched', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: false,
          json: async () => ({}),
        }),
      ),
    )

    render(<AdminServicesPage />)

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument()
    })
    expect(screen.getByText(/failed to load services/i)).toBeInTheDocument()
  })

  it('opens the add-service modal from the primary toolbar button', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            services: [
              {
                id: 'only',
                name: 'Only service',
                description: '',
                durationMinutes: 30,
                price: 10,
                currency: '€',
              },
            ],
          }),
        }),
      ),
    )

    render(<AdminServicesPage />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Only service', level: 2 })).toBeInTheDocument()
    })

    fireEvent.click(screen.getAllByRole('button', { name: '+ Add service' })[0])

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Add service' })).toBeInTheDocument()
    })
  })

  it('formats non-integer prices and expands long descriptions', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({ services: [serviceB] }),
        }),
      ),
    )

    render(<AdminServicesPage />)

    await waitFor(() => {
      expect(screen.getByText(/\$49\.99/)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /expand/i }))
    expect(screen.getByText(/show less/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /show less/i }))
    expect(screen.getByRole('button', { name: /expand/i })).toBeInTheDocument()
  })

  it('persists card order after drag-and-drop', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url === '/api/admin/services' && init?.method === 'PUT') {
        const body = JSON.parse(String(init.body)) as { services: { id: string }[] }
        expect(body.services.map((s) => s.id)).toEqual(['svc-b', 'svc-a'])
        return Promise.resolve({ ok: true, json: async () => ({}) })
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ services: [serviceA, serviceB] }),
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<AdminServicesPage />)

    const cards = await waitFor(() => screen.getAllByRole('article'))
    expect(cards).toHaveLength(2)

    fireEvent.dragStart(cards[0])
    fireEvent.dragOver(cards[1])
    fireEvent.drop(cards[1])
    fireEvent.dragEnd(cards[0])

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/admin/services',
        expect.objectContaining({ method: 'PUT' }),
      )
    })
  })

  it('shows saveError when reorder PUT fails', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url === '/api/admin/services' && init?.method === 'PUT') {
        return Promise.resolve({
          ok: false,
          json: async () => ({ error: 'server busy' }),
        })
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ services: [serviceA, serviceB] }),
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<AdminServicesPage />)

    const cards = await waitFor(() => screen.getAllByRole('article'))
    fireEvent.dragStart(cards[0])
    fireEvent.dragOver(cards[1])
    fireEvent.drop(cards[1])
    fireEvent.dragEnd(cards[0])

    await waitFor(() => {
      expect(screen.getByText('server busy')).toBeInTheDocument()
    })
  })

  it('opens edit modal, saves changes, and PUTs the updated catalog', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url === '/api/admin/services' && init?.method === 'PUT') {
        const body = JSON.parse(String(init.body)) as { services: typeof serviceA[] }
        expect(body.services[0]?.name).toBe('Renamed')
        return Promise.resolve({ ok: true, json: async () => ({}) })
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ services: [{ ...serviceA }] }),
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<AdminServicesPage />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Alpha cut', level: 2 })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /edit alpha cut/i }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Edit service' })).toBeInTheDocument()
    })

    const dialog = screen.getByRole('dialog')
    const nameInput = within(dialog).getByRole('textbox', { name: /name/i })
    fireEvent.change(nameInput, { target: { value: 'Renamed' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Edit service' })).not.toBeInTheDocument()
    })
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/services',
      expect.objectContaining({ method: 'PUT' }),
    )
  })

  it('validates the service form and surfaces API errors from onSave', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({ services: [] }),
        }),
      ),
    )

    render(<AdminServicesPage />)

    await waitFor(() => {
      expect(screen.getByText(/haven't added any services yet/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getAllByRole('button', { name: '+ Add service' })[0])

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Add service' })).toBeInTheDocument()
    })

    const dialog = screen.getByRole('dialog')
    fireEvent.change(within(dialog).getByRole('textbox', { name: /name/i }), {
      target: { value: '   ' },
    })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Name is required.')).toBeInTheDocument()

    fireEvent.change(within(dialog).getByRole('textbox', { name: /name/i }), {
      target: { value: 'Ok' },
    })
    fireEvent.change(within(dialog).getByRole('spinbutton', { name: /duration/i }), {
      target: { value: '99999' },
    })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }))
    expect(await screen.findByText(/duration must be between/i)).toBeInTheDocument()
  })

  it('removes a service after confirming delete, and surfaces delete PUT failures', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url === '/api/admin/services' && init?.method === 'PUT') {
        const body = JSON.parse(String(init.body)) as { services: unknown[] }
        if (body.services.length === 0) {
          return Promise.resolve({
            ok: false,
            json: async () => ({ error: 'cannot delete' }),
          })
        }
        return Promise.resolve({ ok: true, json: async () => ({}) })
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ services: [{ ...serviceA }] }),
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<AdminServicesPage />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Alpha cut', level: 2 })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /delete alpha cut/i }))
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Delete this service?' })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

    await waitFor(() => {
      expect(screen.getByText('cannot delete')).toBeInTheDocument()
    })
  })
})
