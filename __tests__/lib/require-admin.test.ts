// @vitest-environment node
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { ADMIN_SESSION_COOKIE } from '@/lib/admin-session-constants'

const verifySessionTokenMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/admin-session', () => ({
  ADMIN_SESSION_COOKIE: 'bp_admin_session',
  verifySessionToken: verifySessionTokenMock,
  signSession: vi.fn(),
  timingSafeEqualStr: vi.fn(),
}))

import { requireAdminSession } from '@/lib/require-admin'

describe('requireAdminSession', () => {
  beforeEach(() => {
    verifySessionTokenMock.mockReset()
    vi.stubEnv('ADMIN_SESSION_SECRET', 'secret')
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

  it('returns 503 when auth env is missing', () => {
    vi.stubEnv('ADMIN_SESSION_SECRET', '')
    const res = requireAdminSession(reqWithCookie('tok'))
    expect(res).toMatchObject({ status: 503 })
  })

  it('returns 401 when cookie is absent', () => {
    const res = requireAdminSession(reqWithCookie(undefined))
    expect(res).toMatchObject({ status: 401 })
  })

  it('returns 401 when token verification fails', () => {
    verifySessionTokenMock.mockReturnValueOnce(null)
    const res = requireAdminSession(reqWithCookie('bad'))
    expect(res).toMatchObject({ status: 401 })
  })

  it('returns 401 when clientId does not match env', () => {
    verifySessionTokenMock.mockReturnValueOnce({
      email: 'e@e.com',
      clientId: 'other',
      exp: Date.now() + 1000,
    })
    const res = requireAdminSession(reqWithCookie('tok'))
    expect(res).toMatchObject({ status: 401 })
  })

  it('returns payload when session is valid for this client', () => {
    const payload = { email: 'e@e.com', clientId: 'client-a', exp: Date.now() + 1000 }
    verifySessionTokenMock.mockReturnValueOnce(payload)
    expect(requireAdminSession(reqWithCookie('tok'))).toEqual(payload)
  })
})
