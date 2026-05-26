import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import type { HttpRequest, InvocationContext } from '@azure/functions'
import { authMeHandler } from '../functions/auth/me'
import { signAdminJwt } from '../auth/signAdminJwt'
import { ADMIN_SESSION_COOKIE } from '../auth/constants'

const SECRET = 'test-secret-at-least-32-characters-long'

function mockRequest(cookie?: string): HttpRequest {
  const headers = new Map<string, string>()
  if (cookie) {
    headers.set('cookie', `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(cookie)}`)
  }
  return {
    method: 'GET',
    headers: {
      get: (key: string) => headers.get(key.toLowerCase()) ?? null,
    },
    query: new URLSearchParams(),
    params: {},
    user: null,
    body: null,
    bodyUsed: false,
  } as unknown as HttpRequest
}

const mockContext = { error: () => {} } as unknown as InvocationContext

describe('GET /auth/me', () => {
  const prevSecret = process.env.ADMIN_JWT_SECRET

  beforeEach(() => {
    process.env.ADMIN_JWT_SECRET = SECRET
  })

  afterEach(() => {
    process.env.ADMIN_JWT_SECRET = prevSecret
  })

  it('returns session info for a valid cookie', async () => {
    const token = await signAdminJwt('admin@example.com', '1')
    const res = await authMeHandler(mockRequest(token), mockContext)
    assert.equal(res.status, 200)
    assert.deepEqual(res.jsonBody, { email: 'admin@example.com', clientId: '1' })
  })

  it('returns 401 when the cookie is missing', async () => {
    const res = await authMeHandler(mockRequest(), mockContext)
    assert.equal(res.status, 401)
    assert.deepEqual(res.jsonBody, { error: 'Unauthorized' })
  })
})
