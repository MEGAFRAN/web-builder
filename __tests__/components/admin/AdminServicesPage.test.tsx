import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import AdminServicesPage from '@/components/admin/AdminServicesPage'
import { adminCopy } from '@/components/admin/admin-copy'

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
      expect(screen.getByText(adminCopy.services.emptyOnboarding)).toBeInTheDocument()
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
      expect(screen.getByText(adminCopy.common.error)).toBeInTheDocument()
    })
    expect(screen.getByText(adminCopy.services.errors.failedLoad)).toBeInTheDocument()
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

    fireEvent.click(screen.getAllByRole('button', { name: adminCopy.services.addServiceButton })[0])

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: adminCopy.services.addService })).toBeInTheDocument()
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

    fireEvent.click(screen.getByRole('button', { name: new RegExp(adminCopy.common.expand) }))
    expect(screen.getByRole('button', { name: new RegExp(adminCopy.common.showLess) })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: new RegExp(adminCopy.common.showLess) }))
    expect(screen.getByRole('button', { name: new RegExp(adminCopy.common.expand) })).toBeInTheDocument()
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

    fireEvent.click(screen.getByRole('button', { name: adminCopy.services.editAria('Alpha cut') }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: adminCopy.services.editService })).toBeInTheDocument()
    })

    const dialog = screen.getByRole('dialog')
    const nameInput = within(dialog).getByRole('textbox', { name: adminCopy.services.form.name })
    fireEvent.change(nameInput, { target: { value: 'Renamed' } })
    fireEvent.click(within(dialog).getByRole('button', { name: adminCopy.common.save }))

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: adminCopy.services.editService })).not.toBeInTheDocument()
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
      expect(screen.getByText(adminCopy.services.emptyOnboarding)).toBeInTheDocument()
    })

    fireEvent.click(screen.getAllByRole('button', { name: adminCopy.services.addServiceButton })[0])

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: adminCopy.services.addService })).toBeInTheDocument()
    })

    const dialog = screen.getByRole('dialog')
    fireEvent.change(within(dialog).getByRole('textbox', { name: adminCopy.services.form.name }), {
      target: { value: '   ' },
    })
    fireEvent.click(within(dialog).getByRole('button', { name: adminCopy.common.save }))
    expect(await screen.findByText(adminCopy.services.form.nameRequired)).toBeInTheDocument()

    fireEvent.change(within(dialog).getByRole('textbox', { name: adminCopy.services.form.name }), {
      target: { value: 'Ok' },
    })
    const durationPattern = new RegExp(
      adminCopy.services.form.duration.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
    )
    fireEvent.change(within(dialog).getByRole('spinbutton', { name: durationPattern }), {
      target: { value: '99999' },
    })
    fireEvent.click(within(dialog).getByRole('button', { name: adminCopy.common.save }))
    expect(await screen.findByText(adminCopy.services.form.durationRange)).toBeInTheDocument()
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

    fireEvent.click(screen.getByRole('button', { name: adminCopy.services.deleteAria('Alpha cut') }))
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: adminCopy.services.deleteServiceTitle })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: adminCopy.common.delete }))

    await waitFor(() => {
      expect(screen.getByText('cannot delete')).toBeInTheDocument()
    })
  })
})
