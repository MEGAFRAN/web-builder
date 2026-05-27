// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
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

import { GET } from '@/app/api/admin/client-config/route'

describe('GET /api/admin/client-config', () => {
  const session: SessionPayload = {
    email: 'owner@example.com',
    clientId: 'client-x',
    exp: Date.now() + 1e9,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    requireAdminSessionMock.mockResolvedValue(session)
    getClientConfigMock.mockReturnValue({
      displayName: 'Acme Spa',
      header: { logo: 'https://cdn.example/logo.png' },
    })
  })

  it('returns display name and logo from the client config', async () => {
    const req = new NextRequest('http://localhost/api/admin/client-config')
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      displayName: 'Acme Spa',
      logoUrl: 'https://cdn.example/logo.png',
    })
    expect(getClientConfigMock).toHaveBeenCalledWith('client-x')
  })

  it('returns null logo when header logo is absent', async () => {
    getClientConfigMock.mockReturnValueOnce({
      displayName: 'Acme Spa',
      header: null,
    })
    const req = new NextRequest('http://localhost/api/admin/client-config')
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      displayName: 'Acme Spa',
      logoUrl: null,
    })
  })

  it('returns 401 when the admin gate fails', async () => {
    requireAdminSessionMock.mockResolvedValueOnce(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    )
    const req = new NextRequest('http://localhost/api/admin/client-config')
    const res = await GET(req)
    expect(res.status).toBe(401)
    expect(getClientConfigMock).not.toHaveBeenCalled()
  })
})
