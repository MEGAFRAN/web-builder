// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import type { SessionPayload } from '@/types/admin'

const requireAdminSessionMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/require-admin', () => ({
  requireAdminSession: requireAdminSessionMock,
}))

import { GET } from '@/app/api/admin/auth/me/route'

describe('GET /api/admin/auth/me', () => {
  const session: SessionPayload = {
    email: 'owner@example.com',
    clientId: 'client-x',
    exp: Date.now() + 1e9,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    requireAdminSessionMock.mockResolvedValue(session)
  })

  it('returns the authenticated session identity', async () => {
    const req = new NextRequest('http://localhost/api/admin/auth/me')
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      email: 'owner@example.com',
      clientId: 'client-x',
    })
  })

  it('returns 401 when the admin gate fails', async () => {
    requireAdminSessionMock.mockResolvedValueOnce(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    )
    const req = new NextRequest('http://localhost/api/admin/auth/me')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })
})
