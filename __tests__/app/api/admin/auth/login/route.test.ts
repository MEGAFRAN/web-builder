// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { ADMIN_SESSION_COOKIE } from '@/lib/admin-session-constants'
import { verifySessionToken } from '@/lib/admin-session'
import { POST } from '@/app/api/admin/auth/login/route'

function post(body: unknown) {
  return new NextRequest('http://localhost/api/admin/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

describe('POST /api/admin/auth/login', () => {
  const env = {
    ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    CLIENT_ID: process.env.CLIENT_ID,
    NODE_ENV: process.env.NODE_ENV,
  }

  beforeEach(() => {
    process.env.ADMIN_SESSION_SECRET = 'test-secret-at-least-32-chars-ok!'
    process.env.ADMIN_EMAIL = 'Admin@Example.com '
    process.env.ADMIN_PASSWORD = 'hunter2'
    process.env.CLIENT_ID = 'client-x'
    process.env.NODE_ENV = 'development'
  })

  afterEach(() => {
    process.env.ADMIN_SESSION_SECRET = env.ADMIN_SESSION_SECRET
    process.env.ADMIN_EMAIL = env.ADMIN_EMAIL
    process.env.ADMIN_PASSWORD = env.ADMIN_PASSWORD
    process.env.CLIENT_ID = env.CLIENT_ID
    process.env.NODE_ENV = env.NODE_ENV
    vi.restoreAllMocks()
  })

  it('returns 503 when any auth env binding is missing', async () => {
    delete process.env.ADMIN_SESSION_SECRET
    const res = await POST(post({ email: 'Admin@Example.com', password: 'hunter2' }))
    expect(res.status).toBe(503)
    expect(await res.json()).toMatchObject({
      error: expect.stringContaining('not configured'),
    })
  })

  it('returns 400 when the body is not valid JSON', async () => {
    const req = new NextRequest('http://localhost/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Invalid JSON' })
  })

  it.each([
    [
      'wrong email',
      {
        email: 'other@example.com',
        password: 'hunter2',
      },
    ],
    [
      'wrong password',
      {
        email: 'admin@example.com',
        password: 'wrong',
      },
    ],
    [
      'non-string fields',
      {
        email: 1,
        password: 'hunter2',
      },
    ],
  ] as const)('returns 401 when credentials are rejected (%s)', async (_label, body) => {
    const res = await POST(post(body))
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Incorrect email or password' })
  })

  it('returns 200 with a signed session cookie on success', async () => {
    const res = await POST(
      post({ email: '  admin@example.com  ', password: 'hunter2' }),
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    const token = res.cookies.get(ADMIN_SESSION_COOKIE)?.value
    expect(token).toBeDefined()
    const payload = verifySessionToken(token!, process.env.ADMIN_SESSION_SECRET!)
    expect(payload).toMatchObject({ email: 'Admin@Example.com', clientId: 'client-x' })
    expect(payload!.exp).toBeGreaterThan(Date.now())
  })

  it('sets Secure on the cookie in production', async () => {
    process.env.NODE_ENV = 'production'
    const res = await POST(post({ email: 'admin@example.com', password: 'hunter2' }))
    expect(res.status).toBe(200)
    expect(res.cookies.get(ADMIN_SESSION_COOKIE)?.secure).toBe(true)
  })
})
