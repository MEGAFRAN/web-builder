// @vitest-environment node
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { ADMIN_SESSION_COOKIE } from '@/lib/admin-session-constants'

const verifySessionTokenMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/admin-session', () => ({
  ADMIN_SESSION_COOKIE: 'admin-session',
  verifySessionToken: verifySessionTokenMock,
  signSession: vi.fn(),
  timingSafeEqualStr: vi.fn(),
}))

import { requireAdminSession } from '@/lib/require-admin'

describe('requireAdminSession', () => {
  beforeEach(() => {
    verifySessionTokenMock.mockReset()
    vi.stubEnv('ADMIN_JWT_SECRET', 'test-secret-at-least-32-characters-long')
    vi.stubEnv('CLIENT_ID', 'client-a')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  function reqWithCookie(value?: string) {
    const cookieHeader =
      value === undefined ? '' : `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(value)}`
    return new NextRequest('http://localhost/api/admin/x', {
      headers: cookieHeader ? { cookie: cookieHeader } : {},
    })
  }

  it('returns 503 when auth env is missing', async () => {
    vi.stubEnv('ADMIN_JWT_SECRET', '')
    const res = await requireAdminSession(reqWithCookie('tok'))
    expect(res).toMatchObject({ status: 503 })
  })

  it('returns 401 when cookie is absent', async () => {
    const res = await requireAdminSession(reqWithCookie(undefined))
    expect(res).toMatchObject({ status: 401 })
  })

  it('returns 401 when token verification fails', async () => {
    verifySessionTokenMock.mockResolvedValueOnce(null)
    const res = await requireAdminSession(reqWithCookie('bad'))
    expect(res).toMatchObject({ status: 401 })
  })

  it('returns 401 when clientId does not match env', async () => {
    verifySessionTokenMock.mockResolvedValueOnce({
      email: 'e@e.com',
      clientId: 'other',
      exp: Math.floor(Date.now() / 1000) + 3600,
    })
    const res = await requireAdminSession(reqWithCookie('tok'))
    expect(res).toMatchObject({ status: 401 })
  })

  it('returns payload when session is valid for this client', async () => {
    const payload = {
      email: 'e@e.com',
      clientId: 'client-a',
      exp: Math.floor(Date.now() / 1000) + 3600,
    }
    verifySessionTokenMock.mockResolvedValueOnce(payload)
    expect(await requireAdminSession(reqWithCookie('tok'))).toEqual(payload)
  })
})
