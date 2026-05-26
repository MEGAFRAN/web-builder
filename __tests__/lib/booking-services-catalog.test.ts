import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/lib/booking-services-db', () => ({
  readBookingServices: vi.fn(),
}))

vi.mock('@/lib/client-config', () => ({
  getClientConfig: vi.fn(),
}))

import { readBookingServices } from '@/lib/booking-services-db'
import { getClientConfig } from '@/lib/client-config'
import {
  clearBookingServicesCatalogCache,
  getBookingServicesCatalog,
  pageUsesBookingCatalog,
} from '@/lib/booking-services-catalog'
import type { Block } from '@/types/cms'

const mockReadBookingServices = vi.mocked(readBookingServices)
const mockGetClientConfig = vi.mocked(getClientConfig)

describe('pageUsesBookingCatalog', () => {
  it('returns true when the page has a services block', () => {
    const blocks: Block[] = [{ _type: 'services', heading: 'Services' }]
    expect(pageUsesBookingCatalog(blocks)).toBe(true)
  })

  it('returns false when the page has no booking blocks', () => {
    const blocks: Block[] = [{ _type: 'heroBlock', heading: 'Hello' }]
    expect(pageUsesBookingCatalog(blocks)).toBe(false)
  })
})

describe('getBookingServicesCatalog', () => {
  beforeEach(() => {
    clearBookingServicesCatalogCache()
    vi.stubEnv('NEXT_PUBLIC_BOOKING_API_URL', '')
    vi.stubEnv('CLIENT_ID', 'test')
    mockReadBookingServices.mockClear()
    mockReadBookingServices.mockResolvedValue([
      {
        id: 'svc-1',
        name: 'Cut',
        description: 'Haircut',
        durationMinutes: 30,
        price: 20,
        currency: '€',
      },
    ])
    mockGetClientConfig.mockReturnValue({
      clientId: 'test',
    } as ReturnType<typeof getClientConfig>)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('reads from local JSON when no remote booking API is configured', async () => {
    const catalog = await getBookingServicesCatalog('test')
    expect(catalog).toEqual([
      expect.objectContaining({ id: 'svc-1', name: 'Cut' }),
    ])
    expect(mockReadBookingServices).toHaveBeenCalledOnce()
  })

  it('fetches from the remote booking API at build time when configured', async () => {
    clearBookingServicesCatalogCache()
    vi.stubEnv('NEXT_PUBLIC_BOOKING_API_URL', 'https://fn.example.com/api')
    vi.stubEnv('NEXT_PUBLIC_BOOKING_SERVICES_ENDPOINT', '')
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        services: [
          {
            id: 'remote-1',
            name: 'Remote service',
            description: 'From Cosmos',
            durationMinutes: 45,
            price: 30,
            currency: '€',
          },
        ],
      }),
    } as Response)

    const catalog = await getBookingServicesCatalog('remote-client')

    expect(fetchMock).toHaveBeenCalledWith(
      'https://fn.example.com/api/booking-services?clientId=remote-client',
      { cache: 'no-store' },
    )
    expect(catalog).toEqual([
      expect.objectContaining({ id: 'remote-1', name: 'Remote service' }),
    ])
    expect(mockReadBookingServices).not.toHaveBeenCalled()

    fetchMock.mockRestore()
  })
})
