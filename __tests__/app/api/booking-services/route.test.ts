// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/booking-services-db', () => ({
  readBookingServices: vi.fn(),
}))

import { GET } from '@/app/api/booking-services/route'
import { readBookingServices } from '@/lib/booking-services-db'

describe('/api/booking-services', () => {
  const svc = {
    id: 'a',
    name: 'Service A',
    description: '',
    durationMinutes: 60,
    price: 0,
    currency: '€',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('CLIENT_ID', 'tenant-one')
    vi.mocked(readBookingServices).mockResolvedValue([svc])
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns persisted services for this deployment', async () => {
    const res = await GET(new NextRequest('http://localhost/api/booking-services'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ services: [svc] })
  })

  it('accepts matching clientId query param', async () => {
    const res = await GET(
      new NextRequest('http://localhost/api/booking-services?clientId=tenant-one'),
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ services: [svc] })
  })

  it('returns 404 with empty list when clientId mismatches deployment', async () => {
    const res = await GET(
      new NextRequest('http://localhost/api/booking-services?clientId=other'),
    )
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ services: [] })
    expect(readBookingServices).not.toHaveBeenCalled()
  })
})
