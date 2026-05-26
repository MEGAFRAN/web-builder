import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { HttpRequest, InvocationContext } from '@azure/functions'
import { authLoginHandler } from '../functions/auth/login'

function postRequest(body: unknown): HttpRequest {
  return {
    method: 'POST',
    headers: {
      get: () => null,
    },
    query: new URLSearchParams(),
    params: {},
    user: null,
    body: null,
    bodyUsed: false,
    json: async () => body,
  } as unknown as HttpRequest
}

const mockContext = { error: () => {} } as unknown as InvocationContext

describe('POST /auth/login', () => {
  it('returns 503 when clientId is missing', async () => {
    const res = await authLoginHandler(
      postRequest({ email: 'admin@example.com', password: 'secret' }),
      mockContext,
    )
    assert.equal(res.status, 503)
    assert.deepEqual(res.jsonBody, { error: 'Admin login is not configured.' })
  })

  it('returns 400 for invalid JSON', async () => {
    const req = {
      method: 'POST',
      headers: { get: () => null },
      query: new URLSearchParams(),
      params: {},
      user: null,
      body: null,
      bodyUsed: false,
      json: async () => {
        throw new Error('invalid json')
      },
    } as unknown as HttpRequest

    const res = await authLoginHandler(req, mockContext)
    assert.equal(res.status, 400)
    assert.deepEqual(res.jsonBody, { error: 'Invalid JSON body.' })
  })
})
