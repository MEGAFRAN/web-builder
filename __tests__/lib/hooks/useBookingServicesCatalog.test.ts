// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useBookingServicesCatalog } from '@/lib/hooks/useBookingServicesCatalog'
import type { ReservationServiceItem } from '@/types/cms'

describe('useBookingServicesCatalog', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('skips runtime fetch when buildTimeCatalog is provided', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
    const buildTimeCatalog: ReservationServiceItem[] = [
      {
        id: 'svc-1',
        name: 'Cut',
        description: 'Haircut',
        durationMinutes: 30,
        price: 20,
        currency: '€',
      },
    ]

    const { result } = renderHook(() =>
      useBookingServicesCatalog('test', null, buildTimeCatalog),
    )

    expect(result.current.catalogLoaded).toBe(true)
    expect(result.current.liveCatalog).toEqual(buildTimeCatalog)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('fetches at runtime when buildTimeCatalog is omitted', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        services: [
          {
            id: 'svc-2',
            name: 'Color',
            description: 'Hair color',
            durationMinutes: 60,
            price: 50,
            currency: '€',
          },
        ],
      }),
    } as Response)

    const { result } = renderHook(() => useBookingServicesCatalog('test'))

    await waitFor(() => {
      expect(result.current.catalogLoaded).toBe(true)
    })

    expect(fetch).toHaveBeenCalledOnce()
    expect(result.current.liveCatalog).toEqual([
      expect.objectContaining({ id: 'svc-2', name: 'Color' }),
    ])
  })
})
