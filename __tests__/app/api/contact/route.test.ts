import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/contact/route'
import { getClientConfig } from '@/lib/client-config'
import type { ClientConfig } from '@/types/cms'

vi.mock('@/lib/client-config', () => ({
  getClientConfig: vi.fn(),
}))

const mockGetClientConfig = vi.mocked(getClientConfig)

function makeConfig(overrides: Partial<ClientConfig> = {}): ClientConfig {
  return {
    clientId: 'test',
    displayName: 'Test',
    customDomain: 'test.example',
    swaResourceName: 'swa-test',
    features: { blog: false, booking: false, gallery: false, menu: false },
    theme: {},
    pages: [],
    ...overrides,
  }
}

function postRequest(body: unknown) {
  return new NextRequest('http://localhost/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

describe('POST /api/contact', () => {
  const savedClientId = process.env.CLIENT_ID
  const validBody = { name: 'Ada', email: 'ada@example.com', message: 'Hello there.' }

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.CLIENT_ID = 'test'
    mockGetClientConfig.mockReturnValue(makeConfig())
  })

  afterEach(() => {
    process.env.CLIENT_ID = savedClientId
    vi.unstubAllGlobals()
  })

  it('returns 400 when the body is not valid JSON', async () => {
    const res = await POST(postRequest('not json {'))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json).toEqual({ error: 'Invalid JSON' })
  })

  it.each([
    ['null', 'null'],
    ['a number', '42'],
    ['an array', '[]'],
  ] as const)('returns 422 when JSON parses to %s', async (_label, raw) => {
    const req = new NextRequest('http://localhost/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: raw,
    })
    const res = await POST(req)
    expect(res.status).toBe(422)
  })

  it('returns 422 when required string fields are missing or wrong type', async () => {
    const res = await POST(
      postRequest({ name: 'A', email: 'a@b.com', message: 123 })
    )
    expect(res.status).toBe(422)
  })

  it('returns 422 when trimmed fields are empty', async () => {
    const res = await POST(postRequest({ name: '  ', email: 'a@b.com', message: 'x' }))
    expect(res.status).toBe(422)
    const json = await res.json()
    expect(json.error).toContain('name, email, and message')
  })

  it('returns 500 when CLIENT_ID is not set', async () => {
    delete process.env.CLIENT_ID
    const res = await POST(postRequest(validBody))
    expect(res.status).toBe(500)
    expect(await res.json()).toMatchObject({ error: expect.stringContaining('CLIENT_ID') })
  })

  it('acknowledges locally when no contactEndpoint is configured', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const res = await POST(postRequest(validBody))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(logSpy).toHaveBeenCalledWith(
      '[contact] Submission received:',
      expect.objectContaining({
        name: 'Ada',
        email: 'ada@example.com',
        messageLength: validBody.message.length,
      }),
    )
    logSpy.mockRestore()
  })

  it('forwards to contactEndpoint and returns 200 when upstream succeeds', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 } as Response)
    vi.stubGlobal('fetch', fetchMock)
    mockGetClientConfig.mockReturnValue(
      makeConfig({ contactEndpoint: 'https://hooks.example/contact' }),
    )

    const res = await POST(postRequest(validBody))

    expect(res.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledWith(
      'https://hooks.example/contact',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validBody),
      }),
    )
    vi.unstubAllGlobals()
  })

  it('returns 502 when upstream responds with a non-OK status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 502 } as Response),
    )
    mockGetClientConfig.mockReturnValue(
      makeConfig({ contactEndpoint: 'https://hooks.example/contact' }),
    )

    const res = await POST(postRequest(validBody))
    expect(res.status).toBe(502)
    expect(await res.json()).toMatchObject({
      error: expect.stringContaining('Upstream'),
    })
    vi.unstubAllGlobals()
  })

  it('returns 502 when fetch to contactEndpoint throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    mockGetClientConfig.mockReturnValue(
      makeConfig({ contactEndpoint: 'https://hooks.example/contact' }),
    )

    const res = await POST(postRequest(validBody))
    expect(res.status).toBe(502)
    vi.unstubAllGlobals()
  })

  it('falls back to local handler when getClientConfig throws', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    mockGetClientConfig.mockImplementation(() => {
      throw new Error('config read failed')
    })

    const res = await POST(postRequest(validBody))
    expect(res.status).toBe(200)
    expect(logSpy).toHaveBeenCalled()
    logSpy.mockRestore()
  })
})
