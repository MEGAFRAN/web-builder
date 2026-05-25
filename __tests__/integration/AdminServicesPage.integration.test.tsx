import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react'
import AdminServicesPage from '@/components/admin/AdminServicesPage'
import { adminCopy } from '@/components/admin/admin-copy'
import type { AdminBookingService } from '@/types/admin'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const serviceA: AdminBookingService = {
  id: 'svc-a',
  name: 'Alpha cut',
  description: 'Short trim.',
  durationMinutes: 30,
  price: 40,
  currency: '€',
}

const serviceB: AdminBookingService = {
  id: 'svc-b',
  name: 'Beta style',
  description: 'Long styling session.',
  durationMinutes: 60,
  price: 49.99,
  currency: '$',
  category: 'Coloración',
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

function servicesCalls(fetchSpy: { mock: { calls: unknown[][] } }) {
  return fetchSpy.mock.calls.filter(
    (c): c is [string, RequestInit | undefined] =>
      Array.isArray(c) && typeof c[0] === 'string' && c[0] === '/api/admin/services',
  )
}

/** Mount queues catalog fetch in a microtask; flush so setState runs inside act. */
async function renderServicesPage() {
  const utils = render(<AdminServicesPage />)
  await act(async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 0))
  })
  return utils
}

async function waitForCatalogLoaded() {
  await waitFor(() => {
    expect(screen.queryByText(adminCopy.common.loading)).not.toBeInTheDocument()
  })
}

function mockServicesFetch(
  initialServices: AdminBookingService[],
  handlers?: (url: string, init?: RequestInit) => Response | undefined,
) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
    const url = fetchInputUrl(input)
    const override = handlers?.(url, init)
    if (override) return Promise.resolve(override)

    if (url === '/api/admin/services') {
      return Promise.resolve(jsonResponse({ services: initialServices }))
    }
    return Promise.reject(new Error(`Unexpected fetch: ${url}`))
  })
}

function openAddServiceModal() {
  fireEvent.click(screen.getAllByRole('button', { name: adminCopy.services.addServiceButton })[0])
}

async function fillSimpleServiceForm(
  dialog: HTMLElement,
  {
    name,
    description = '',
    durationMinutes = '45',
    price = '35',
    currency = '€',
  }: {
    name: string
    description?: string
    durationMinutes?: string
    price?: string
    currency?: string
  },
) {
  fireEvent.change(within(dialog).getByRole('textbox', { name: adminCopy.services.form.name }), {
    target: { value: name },
  })
  if (description) {
    fireEvent.change(within(dialog).getByRole('textbox', { name: adminCopy.services.form.description }), {
      target: { value: description },
    })
  }
  const durationPattern = new RegExp(
    adminCopy.services.form.duration.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
  )
  fireEvent.change(within(dialog).getByRole('spinbutton', { name: durationPattern }), {
    target: { value: durationMinutes },
  })
  fireEvent.change(within(dialog).getByRole('spinbutton', { name: adminCopy.services.form.price }), {
    target: { value: price },
  })
  fireEvent.change(within(dialog).getByRole('textbox', { name: adminCopy.services.form.currency }), {
    target: { value: currency },
  })
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AdminServicesPage', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    fetchSpy = mockServicesFetch([serviceA, serviceB])
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  describe('initial load', () => {
    it('loads the catalog from GET /api/admin/services and renders service cards', async () => {
      await renderServicesPage()
      await waitForCatalogLoaded()

      expect(fetch).toHaveBeenCalledWith('/api/admin/services', { credentials: 'include' })
      expect(screen.getByRole('heading', { name: adminCopy.services.heading, level: 1 })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Alpha cut', level: 3 })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Beta style', level: 3 })).toBeInTheDocument()
      expect(screen.getByText(/short trim/i)).toBeInTheDocument()
    })

    it('shows onboarding guidance when the catalog is empty', async () => {
      fetchSpy.mockRestore()
      fetchSpy = mockServicesFetch([])

      await renderServicesPage()
      await waitForCatalogLoaded()

      expect(screen.getByText(adminCopy.services.emptyOnboarding)).toBeInTheDocument()
    })

    it('shows an error alert when the catalog cannot be fetched', async () => {
      fetchSpy.mockRestore()
      fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({}, false))

      await renderServicesPage()

      await waitFor(() => {
        expect(screen.getByText(adminCopy.common.error)).toBeInTheDocument()
        expect(screen.getByText(adminCopy.services.errors.failedLoad)).toBeInTheDocument()
      })
    })

    it('groups services under category headings', async () => {
      fetchSpy.mockRestore()
      fetchSpy = mockServicesFetch([
        { ...serviceA, category: 'Cortes' },
        serviceB,
        {
          id: 'svc-c',
          name: 'Blow dry',
          description: '',
          durationMinutes: 30,
          price: 25,
          currency: '€',
          category: 'Cortes',
        },
      ])

      await renderServicesPage()
      await waitForCatalogLoaded()

      expect(screen.getByRole('heading', { name: 'Cortes', level: 2 })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Coloración', level: 2 })).toBeInTheDocument()
    })
  })

  describe('add service', () => {
    it('creates the first service from the empty onboarding flow', async () => {
      fetchSpy.mockRestore()
      fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
        const url = fetchInputUrl(input)
        if (url === '/api/admin/services' && init?.method === 'PUT') {
          const body = JSON.parse(String(init.body)) as { services: AdminBookingService[] }
          expect(body.services).toHaveLength(1)
          expect(body.services[0]).toMatchObject({
            name: 'Haircut',
            description: 'Wash and trim.',
            durationMinutes: 45,
            price: 35,
            currency: '€',
          })
          return Promise.resolve(jsonResponse({}))
        }
        return Promise.resolve(jsonResponse({ services: [] }))
      })

      await renderServicesPage()
      await waitForCatalogLoaded()

      openAddServiceModal()
      const dialog = await screen.findByRole('dialog')
      await fillSimpleServiceForm(dialog, {
        name: 'Haircut',
        description: 'Wash and trim.',
        durationMinutes: '45',
        price: '35',
      })
      fireEvent.click(within(dialog).getByRole('button', { name: adminCopy.common.save }))

      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: adminCopy.services.addService })).not.toBeInTheDocument()
        expect(screen.getByRole('heading', { name: 'Haircut', level: 3 })).toBeInTheDocument()
      })

      const putCalls = servicesCalls(fetchSpy).filter(([, init]) => init?.method === 'PUT')
      expect(putCalls).toHaveLength(1)
      expect(putCalls[0][1]).toMatchObject({
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })
    })

    it('adds a service with a new category when categories already exist', async () => {
      fetchSpy.mockRestore()
      fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
        const url = fetchInputUrl(input)
        if (url === '/api/admin/services' && init?.method === 'PUT') {
          const body = JSON.parse(String(init.body)) as { services: AdminBookingService[] }
          expect(body.services.at(-1)).toMatchObject({
            name: 'Tinte',
            category: 'Coloración',
          })
          return Promise.resolve(jsonResponse({}))
        }
        return Promise.resolve(jsonResponse({ services: [{ ...serviceA, category: 'Cortes' }] }))
      })

      await renderServicesPage()
      await waitForCatalogLoaded()

      openAddServiceModal()
      const dialog = await screen.findByRole('dialog')
      fireEvent.change(within(dialog).getByRole('textbox', { name: adminCopy.services.form.name }), {
        target: { value: 'Tinte' },
      })

      const select = within(dialog).getByRole('combobox', { name: adminCopy.services.form.category })
      fireEvent.change(select, { target: { value: '__new__' } })
      fireEvent.change(
        within(dialog).getByRole('textbox', { name: adminCopy.services.form.newCategoryPlaceholder }),
        { target: { value: 'Coloración' } },
      )
      await fillSimpleServiceForm(dialog, { name: 'Tinte' })
      fireEvent.click(within(dialog).getByRole('button', { name: adminCopy.common.save }))

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Tinte', level: 3 })).toBeInTheDocument()
      })
    })

    it('blocks save and shows validation when the name is empty', async () => {
      fetchSpy.mockRestore()
      fetchSpy = mockServicesFetch([])

      await renderServicesPage()
      await waitForCatalogLoaded()

      openAddServiceModal()
      const dialog = await screen.findByRole('dialog')
      fireEvent.click(within(dialog).getByRole('button', { name: adminCopy.common.save }))

      expect(await screen.findByText(adminCopy.services.form.nameRequired)).toBeInTheDocument()
      expect(servicesCalls(fetchSpy).filter(([, init]) => init?.method === 'PUT')).toHaveLength(0)
    })
  })

  describe('edit and delete', () => {
    it('edits a service and PUTs the updated catalog', async () => {
      fetchSpy.mockRestore()
      fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
        const url = fetchInputUrl(input)
        if (url === '/api/admin/services' && init?.method === 'PUT') {
          const body = JSON.parse(String(init.body)) as { services: AdminBookingService[] }
          expect(body.services[0]?.name).toBe('Renamed cut')
          return Promise.resolve(jsonResponse({}))
        }
        return Promise.resolve(jsonResponse({ services: [{ ...serviceA }] }))
      })

      await renderServicesPage()
      await waitForCatalogLoaded()

      fireEvent.click(screen.getByRole('button', { name: adminCopy.services.editAria('Alpha cut') }))
      const dialog = await screen.findByRole('dialog')
      fireEvent.change(within(dialog).getByRole('textbox', { name: adminCopy.services.form.name }), {
        target: { value: 'Renamed cut' },
      })
      fireEvent.click(within(dialog).getByRole('button', { name: adminCopy.common.save }))

      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: adminCopy.services.editService })).not.toBeInTheDocument()
        expect(screen.getByRole('heading', { name: 'Renamed cut', level: 3 })).toBeInTheDocument()
      })
    })

    it('removes a service after confirming delete', async () => {
      fetchSpy.mockRestore()
      fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
        const url = fetchInputUrl(input)
        if (url === '/api/admin/services' && init?.method === 'PUT') {
          const body = JSON.parse(String(init.body)) as { services: AdminBookingService[] }
          expect(body.services).toHaveLength(0)
          return Promise.resolve(jsonResponse({}))
        }
        return Promise.resolve(jsonResponse({ services: [{ ...serviceA }] }))
      })

      await renderServicesPage()
      await waitForCatalogLoaded()

      fireEvent.click(screen.getByRole('button', { name: adminCopy.services.deleteAria('Alpha cut') }))
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: adminCopy.services.deleteServiceTitle })).toBeInTheDocument()
      })
      fireEvent.click(screen.getByRole('button', { name: adminCopy.common.delete }))

      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: 'Alpha cut', level: 3 })).not.toBeInTheDocument()
        expect(screen.getByText(adminCopy.services.emptyOnboarding)).toBeInTheDocument()
      })
    })
  })

  describe('reorder', () => {
    it('persists card order after drag-and-drop', async () => {
      fetchSpy.mockRestore()
      fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
        const url = fetchInputUrl(input)
        if (url === '/api/admin/services' && init?.method === 'PUT') {
          const body = JSON.parse(String(init.body)) as { services: { id: string }[] }
          expect(body.services.map((s) => s.id)).toEqual(['svc-b', 'svc-a'])
          return Promise.resolve(jsonResponse({}))
        }
        return Promise.resolve(jsonResponse({ services: [serviceA, serviceB] }))
      })

      await renderServicesPage()
      const cards = await screen.findAllByRole('article')
      expect(cards).toHaveLength(2)

      fireEvent.dragStart(cards[0])
      fireEvent.dragOver(cards[1])
      fireEvent.drop(cards[1])
      fireEvent.dragEnd(cards[0])

      await waitFor(() => {
        expect(servicesCalls(fetchSpy).filter(([, init]) => init?.method === 'PUT')).toHaveLength(1)
      })
    })

    it('shows saveError when reorder PUT fails', async () => {
      fetchSpy.mockRestore()
      fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
        const url = fetchInputUrl(input)
        if (url === '/api/admin/services' && init?.method === 'PUT') {
          return Promise.resolve(jsonResponse({ error: 'server busy' }, false))
        }
        return Promise.resolve(jsonResponse({ services: [serviceA, serviceB] }))
      })

      await renderServicesPage()
      const cards = await screen.findAllByRole('article')

      fireEvent.dragStart(cards[0])
      fireEvent.dragOver(cards[1])
      fireEvent.drop(cards[1])
      fireEvent.dragEnd(cards[0])

      await waitFor(() => {
        expect(screen.getByText('server busy')).toBeInTheDocument()
      })
    })
  })

  describe('variations', () => {
    it('adds a service with duration/price variations and shows the card summary', async () => {
      fetchSpy.mockRestore()
      let savedVariations: AdminBookingService['variations']
      fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
        const url = fetchInputUrl(input)
        if (url === '/api/admin/services' && init?.method === 'PUT') {
          const body = JSON.parse(String(init.body)) as { services: AdminBookingService[] }
          savedVariations = body.services.at(-1)?.variations
          return Promise.resolve(jsonResponse({}))
        }
        return Promise.resolve(jsonResponse({ services: [] }))
      })

      await renderServicesPage()
      await waitForCatalogLoaded()

      openAddServiceModal()
      const dialog = await screen.findByRole('dialog')
      fireEvent.change(within(dialog).getByRole('textbox', { name: adminCopy.services.form.name }), {
        target: { value: 'Swedish Massage' },
      })
      fireEvent.click(
        within(dialog).getByRole('checkbox', { name: adminCopy.services.form.hasVariations }),
      )

      fireEvent.change(within(dialog).getAllByRole('spinbutton')[0], { target: { value: '30' } })
      fireEvent.change(within(dialog).getAllByRole('spinbutton')[1], { target: { value: '40' } })

      fireEvent.click(within(dialog).getByRole('button', { name: adminCopy.services.form.addVariation }))

      const updatedRows = within(dialog).getAllByRole('textbox', {
        name: adminCopy.services.form.variationLabel,
      })
      fireEvent.change(updatedRows[1], { target: { value: 'Standard' } })
      fireEvent.change(within(dialog).getAllByRole('spinbutton')[2], { target: { value: '60' } })
      fireEvent.change(within(dialog).getAllByRole('spinbutton')[3], { target: { value: '60' } })

      fireEvent.click(within(dialog).getByRole('button', { name: adminCopy.common.save }))

      await waitFor(() => {
        expect(screen.getByText(/30 min \(€40\).*60 min \(€60\)/)).toBeInTheDocument()
      })

      expect(savedVariations).toEqual([
        { id: expect.any(String), durationMinutes: 30, price: 40 },
        { id: expect.any(String), label: 'Standard', durationMinutes: 60, price: 60 },
      ])
    })
  })
})
