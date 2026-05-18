// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { getClientConfig } from '@/lib/client-config'
import type { ClientConfig } from '@/types/cms'

const readFileMock = vi.hoisted(() => vi.fn())
const writeFileMock = vi.hoisted(() => vi.fn())

vi.mock('fs', () => ({
  promises: {
    readFile: readFileMock,
    writeFile: writeFileMock,
  },
  default: {},
}))

vi.mock('@/lib/client-config', () => ({
  getClientConfig: vi.fn(),
}))

import { POST } from '@/app/api/reservation/route'

const mockGetClientConfig = vi.mocked(getClientConfig)

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeConfig(overrides: Partial<ClientConfig> = {}): ClientConfig {
  return {
    clientId: 'test',
    displayName: 'Test Client',
    customDomain: 'test.example.com',
    swaResourceName: 'swa-test',
    features: { blog: false, booking: true, gallery: false, menu: false },
    theme: {},
    pages: [],
    ...overrides,
  }
}

const VALID_BODY = {
  serviceId: 'standard-meal',
  durationMinutes: 60,
  name: 'Jane Smith',
  email: 'jane@example.com',
  phone: '+34 600 000 000',
  date: '2026-12-25',
  time: '13:00',
}

function postRequest(body: unknown) {
  return new NextRequest('http://localhost/api/reservation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/reservation — input validation', () => {
  const savedClientId = process.env.CLIENT_ID

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.CLIENT_ID = 'test'
    mockGetClientConfig.mockReturnValue(makeConfig())
  })

  afterEach(() => {
    process.env.CLIENT_ID = savedClientId
    vi.unstubAllGlobals()
  })

  it('returns 400 when the request body is not valid JSON', async () => {
    const res = await POST(postRequest('not json {'))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Invalid JSON' })
  })

  it.each([
    ['null', 'null'],
    ['a number', '42'],
    ['an array', '[]'],
  ] as const)('returns 422 when JSON parses to %s', async (_label, raw) => {
    const req = new NextRequest('http://localhost/api/reservation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: raw,
    })
    const res = await POST(req)
    expect(res.status).toBe(422)
  })

  it('returns 422 when name is missing', async () => {
    const { name: _, ...rest } = VALID_BODY
    const res = await POST(postRequest(rest))
    expect(res.status).toBe(422)
  })

  it('returns 422 when email is missing', async () => {
    const { email: _, ...rest } = VALID_BODY
    const res = await POST(postRequest(rest))
    expect(res.status).toBe(422)
  })

  it('returns 422 when phone is missing', async () => {
    const { phone: _, ...rest } = VALID_BODY
    const res = await POST(postRequest(rest))
    expect(res.status).toBe(422)
  })

  it('returns 422 when date is missing', async () => {
    const { date: _, ...rest } = VALID_BODY
    const res = await POST(postRequest(rest))
    expect(res.status).toBe(422)
  })

  it('returns 422 when time is missing', async () => {
    const { time: _, ...rest } = VALID_BODY
    const res = await POST(postRequest(rest))
    expect(res.status).toBe(422)
  })

  it('returns 422 when serviceId is missing', async () => {
    const { serviceId: _, ...rest } = VALID_BODY
    const res = await POST(postRequest(rest))
    expect(res.status).toBe(422)
  })

  it('returns 422 when durationMinutes is missing', async () => {
    const { durationMinutes: _, ...rest } = VALID_BODY
    const res = await POST(postRequest(rest))
    expect(res.status).toBe(422)
  })

  it('returns 422 when durationMinutes is a string instead of a number', async () => {
    const res = await POST(postRequest({ ...VALID_BODY, durationMinutes: '60' }))
    expect(res.status).toBe(422)
  })

  it('returns 422 when durationMinutes is less than 1', async () => {
    const res = await POST(postRequest({ ...VALID_BODY, durationMinutes: 0 }))
    expect(res.status).toBe(422)
  })

  it('returns 422 when name trims to empty string', async () => {
    const res = await POST(postRequest({ ...VALID_BODY, name: '   ' }))
    expect(res.status).toBe(422)
    const json = await res.json()
    expect(json.error).toMatch(/missing or invalid/i)
  })

  it('returns 422 when email trims to empty string', async () => {
    const res = await POST(postRequest({ ...VALID_BODY, email: '  ' }))
    expect(res.status).toBe(422)
  })

  it('returns 422 when date trims to empty string', async () => {
    const res = await POST(postRequest({ ...VALID_BODY, date: '' }))
    expect(res.status).toBe(422)
  })
})

describe('POST /api/reservation — CLIENT_ID guard', () => {
  const savedClientId = process.env.CLIENT_ID

  afterEach(() => {
    process.env.CLIENT_ID = savedClientId
  })

  it('returns 500 when CLIENT_ID environment variable is not set', async () => {
    delete process.env.CLIENT_ID
    const res = await POST(postRequest(VALID_BODY))
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toContain('CLIENT_ID')
  })
})

describe('POST /api/reservation — local fallback (no reservationEndpoint)', () => {
  const savedClientId = process.env.CLIENT_ID

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.CLIENT_ID = 'test'
    mockGetClientConfig.mockReturnValue(makeConfig())
    readFileMock.mockResolvedValue(JSON.stringify([]))
    writeFileMock.mockResolvedValue(undefined)
  })

  afterEach(() => {
    process.env.CLIENT_ID = savedClientId
    vi.unstubAllGlobals()
  })

  it('acknowledges the submission locally when reservationEndpoint is not configured', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const res = await POST(postRequest(VALID_BODY))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    logSpy.mockRestore()
  })

  it('logs after saving locally with the new record id', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    await POST(postRequest(VALID_BODY))
    expect(logSpy).toHaveBeenCalledWith(
      '[reservation] Saved locally:',
      expect.stringMatching(/^test-\d+-[a-z0-9]+$/),
    )
    logSpy.mockRestore()
  })

  it('falls back to local handler when getClientConfig throws', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    mockGetClientConfig.mockImplementation(() => {
      throw new Error('config read failed')
    })
    const res = await POST(postRequest(VALID_BODY))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    logSpy.mockRestore()
  })
})

describe('POST /api/reservation — forwarding to reservationEndpoint', () => {
  const savedClientId = process.env.CLIENT_ID
  const ENDPOINT = 'https://my-functions.azurewebsites.net/api/reservations'

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.CLIENT_ID = 'test'
    mockGetClientConfig.mockReturnValue(makeConfig({ reservationEndpoint: ENDPOINT }))
  })

  afterEach(() => {
    process.env.CLIENT_ID = savedClientId
    vi.unstubAllGlobals()
  })

  it('forwards the payload to reservationEndpoint with clientId injected', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 201 } as Response)
    vi.stubGlobal('fetch', fetchMock)

    const res = await POST(postRequest(VALID_BODY))

    expect(res.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledOnce()

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(ENDPOINT)
    expect(init.method).toBe('POST')
    expect(init.headers).toMatchObject({ 'Content-Type': 'application/json' })

    const forwarded = JSON.parse(init.body as string)
    expect(forwarded).toMatchObject({ ...VALID_BODY, clientId: 'test' })
  })

  it('returns { ok: true } on successful upstream response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true } as Response))
    const res = await POST(postRequest(VALID_BODY))
    expect(await res.json()).toEqual({ ok: true })
  })

  it('returns 502 when upstream responds with a non-OK status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 } as Response))
    const res = await POST(postRequest(VALID_BODY))
    expect(res.status).toBe(502)
    expect(await res.json()).toMatchObject({ error: expect.stringContaining('Upstream') })
  })

  it('returns 502 when fetch to reservationEndpoint throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('connection refused')))
    const res = await POST(postRequest(VALID_BODY))
    expect(res.status).toBe(502)
    const json = await res.json()
    expect(json.error).toMatch(/failed to reach/i)
  })

  it('does not call fetch when the payload is invalid', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const { name: _, ...incomplete } = VALID_BODY
    await POST(postRequest(incomplete))
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('passes the correct Content-Type header to the upstream call', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true } as Response)
    vi.stubGlobal('fetch', fetchMock)
    await POST(postRequest(VALID_BODY))
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json')
  })
})
