import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import type { HttpRequest } from '@azure/functions'
import { SignJWT } from 'jose'
import { signAdminJwt } from '../auth/signAdminJwt'
import { ADMIN_SESSION_COOKIE } from '../auth/constants'
import { verifyAdminJwt, validateAdminJwt } from '../auth/validateAdminJwt'

const SECRET = 'test-secret-at-least-32-characters-long'

function mockRequest(
  init: {
    method?: string
    cookie?: string
    bearerToken?: string
    params?: Record<string, string>
  } = {},
): HttpRequest {
  const headers = new Map<string, string>()
  if (init.cookie) {
    headers.set('cookie', `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(init.cookie)}`)
  }
  if (init.bearerToken) {
    headers.set('authorization', `Bearer ${init.bearerToken}`)
  }
  return {
    method: init.method ?? 'GET',
    headers: {
      get: (key: string) => headers.get(key.toLowerCase()) ?? null,
    },
    query: new URLSearchParams(),
    params: init.params ?? {},
    user: null,
    body: null,
    bodyUsed: false,
  } as unknown as HttpRequest
}

describe('admin JWT auth', () => {
  const prevSecret = process.env.ADMIN_JWT_SECRET

  beforeEach(() => {
    process.env.ADMIN_JWT_SECRET = SECRET
  })

  afterEach(() => {
    process.env.ADMIN_JWT_SECRET = prevSecret
  })

  it('signs and validates a JWT', async () => {
    const token = await signAdminJwt('admin@example.com', '1')
    const session = await validateAdminJwt(mockRequest({ cookie: token }))
    assert.equal(session.email, 'admin@example.com')
    assert.equal(session.clientId, '1')
    assert.ok(session.exp > Math.floor(Date.now() / 1000))
  })

  it('accepts a valid Bearer token in the Authorization header', async () => {
    const token = await signAdminJwt('admin@example.com', '1')
    const session = await validateAdminJwt(mockRequest({ bearerToken: token }))
    assert.equal(session.email, 'admin@example.com')
    assert.equal(session.clientId, '1')
  })

  it('prefers Bearer header over cookie when both are present', async () => {
    const cookieToken = await signAdminJwt('cookie@example.com', 'c1')
    const bearerToken = await signAdminJwt('bearer@example.com', 'b1')
    const session = await validateAdminJwt(mockRequest({ cookie: cookieToken, bearerToken }))
    assert.equal(session.email, 'bearer@example.com')
  })

  it('rejects a missing cookie with 401', async () => {
    await assert.rejects(
      () => validateAdminJwt(mockRequest()),
      (err: unknown) => {
        assert.ok(err instanceof Error)
        assert.equal((err as { status?: number }).status, 401)
        return true
      },
    )
  })

  it('rejects a tampered token with 401', async () => {
    const token = await signAdminJwt('admin@example.com', '1')
    await assert.rejects(
      () => verifyAdminJwt(`${token}x`),
      (err: unknown) => {
        assert.equal((err as { status?: number }).status, 401)
        return true
      },
    )
  })

  it('rejects an expired token with 401', async () => {
    const expired = await new SignJWT({ email: 'admin@example.com', clientId: '1' })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('0s')
      .sign(new TextEncoder().encode(SECRET))

    await assert.rejects(
      () => verifyAdminJwt(expired),
      (err: unknown) => {
        assert.equal((err as { status?: number }).status, 401)
        return true
      },
    )
  })
})
