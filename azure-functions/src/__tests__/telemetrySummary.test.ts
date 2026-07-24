import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import type { HttpRequest, InvocationContext } from '@azure/functions'
import { signAdminJwt } from '../auth/signAdminJwt'
import { telemetrySummaryHandler } from '../functions/admin/telemetrySummary'

const SECRET = 'test-secret-at-least-32-characters-long'

function getRequest(token: string | null, month: string | null = null): HttpRequest {
  const headers = new Map<string, string>()
  if (token) headers.set('authorization', `Bearer ${token}`)
  headers.set('origin', 'https://admin.example')

  return {
    method: 'GET',
    headers: {
      get: (key: string) => headers.get(key.toLowerCase()) ?? null,
    },
    query: new URLSearchParams(month ? { month } : {}),
    params: {},
    user: null,
    body: null,
    bodyUsed: false,
  } as unknown as HttpRequest
}

const mockContext = {
  log: () => {},
  error: () => {},
} as unknown as InvocationContext

describe('GET /mgmt/telemetry/summary', () => {
  const prevSecret = process.env.ADMIN_JWT_SECRET
  const prevEndpoint = process.env.COSMOS_ENDPOINT
  const prevKey = process.env.COSMOS_KEY

  beforeEach(() => {
    process.env.ADMIN_JWT_SECRET = SECRET
    delete process.env.COSMOS_ENDPOINT
    delete process.env.COSMOS_KEY
  })

  afterEach(() => {
    process.env.ADMIN_JWT_SECRET = prevSecret
    process.env.COSMOS_ENDPOINT = prevEndpoint
    process.env.COSMOS_KEY = prevKey
  })

  it('returns 401 without admin JWT', async () => {
    const res = await telemetrySummaryHandler(getRequest(null), mockContext)
    assert.equal(res.status, 401)
  })

  it('returns 400 for invalid month format', async () => {
    const token = await signAdminJwt('admin@example.com', 'tenant-1')
    const res = await telemetrySummaryHandler(getRequest(token, 'July'), mockContext)
    assert.equal(res.status, 400)
  })

  it('requires JWT before querying tenant data (Cosmos misconfig yields 500, not 401)', async () => {
    const token = await signAdminJwt('admin@example.com', 'tenant-1')
    const res = await telemetrySummaryHandler(getRequest(token, '2026-07'), mockContext)
    assert.notEqual(res.status, 401)
  })
})
