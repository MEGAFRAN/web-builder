// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import type { SessionPayload } from '@/types/admin'

const requireAdminSessionMock = vi.hoisted(() => vi.fn())
const getClientConfigMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/require-admin', () => ({
  requireAdminSession: requireAdminSessionMock,
}))

vi.mock('@/lib/client-config', () => ({
  getClientConfig: getClientConfigMock,
}))

import { GET } from '@/app/api/admin/booking-settings/route'

describe('GET /api/admin/booking-settings', () => {
  const session: SessionPayload = {
    email: 'owner@example.com',
    clientId: 'client-x',
    exp: Date.now() + 1e9,
  }

  const savedClientId = process.env.CLIENT_ID

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.CLIENT_ID = 'client-x'
    requireAdminSessionMock.mockResolvedValue(session)
    getClientConfigMock.mockReturnValue({
      bookingSettings: {
        enforceGuarantee: true,
        cancellationFeePercent: 50,
        currency: 'USD',
      },
    })
  })

  afterEach(() => {
    process.env.CLIENT_ID = savedClientId
  })

  it('returns booking settings from the client config', async () => {
    const req = new NextRequest('http://localhost/api/admin/booking-settings')
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      bookingSettings: {
        enforceGuarantee: true,
        cancellationFeePercent: 50,
        currency: 'USD',
      },
    })
    expect(getClientConfigMock).toHaveBeenCalledWith('client-x')
  })

  it('returns null booking settings when the config omits them', async () => {
    getClientConfigMock.mockReturnValueOnce({})
    const req = new NextRequest('http://localhost/api/admin/booking-settings')
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ bookingSettings: null })
  })

  it('returns 500 when CLIENT_ID is not configured', async () => {
    delete process.env.CLIENT_ID
    const req = new NextRequest('http://localhost/api/admin/booking-settings')
    const res = await GET(req)
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'CLIENT_ID not configured.' })
    expect(getClientConfigMock).not.toHaveBeenCalled()
  })

  it('returns null booking settings when client config lookup fails', async () => {
    getClientConfigMock.mockImplementationOnce(() => {
      throw new Error('missing config')
    })
    const req = new NextRequest('http://localhost/api/admin/booking-settings')
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ bookingSettings: null })
  })

  it('returns 401 when the admin gate fails', async () => {
    requireAdminSessionMock.mockResolvedValueOnce(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    )
    const req = new NextRequest('http://localhost/api/admin/booking-settings')
    const res = await GET(req)
    expect(res.status).toBe(401)
    expect(getClientConfigMock).not.toHaveBeenCalled()
  })
})
