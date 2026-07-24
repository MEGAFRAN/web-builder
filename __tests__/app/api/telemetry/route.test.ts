import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/telemetry/route'
import * as store from '@/lib/telemetry-local-store'

vi.mock('@/lib/telemetry-local-store', () => ({
  incrementTelemetryCounter: vi.fn(),
}))

const mockIncrement = vi.mocked(store.incrementTelemetryCounter)

function postRequest(body: string, contentType = 'text/plain') {
  return new NextRequest('http://localhost/api/telemetry', {
    method: 'POST',
    headers: { 'Content-Type': contentType },
    body,
  })
}

const validPayload = {
  site_id: 'test',
  event_type: 'click_phone',
  timestamp: '2026-07-24T12:00:00.000Z',
}

describe('POST /api/telemetry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIncrement.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns 204 and increments counter for valid text/plain payload', async () => {
    const res = await POST(postRequest(JSON.stringify(validPayload)))
    expect(res.status).toBe(204)
    expect(mockIncrement).toHaveBeenCalledWith('test', 'click_phone', '2026-07-24')
  })

  it('accepts application/json payloads', async () => {
    const res = await POST(
      postRequest(JSON.stringify(validPayload), 'application/json'),
    )
    expect(res.status).toBe(204)
  })

  it('increments on repeated POSTs (store called each time)', async () => {
    await POST(postRequest(JSON.stringify(validPayload)))
    await POST(postRequest(JSON.stringify(validPayload)))
    expect(mockIncrement).toHaveBeenCalledTimes(2)
  })

  it('returns 400 for invalid JSON', async () => {
    const res = await POST(postRequest('not-json'))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Invalid JSON' })
  })

  it('returns 422 for missing or invalid fields', async () => {
    const res = await POST(
      postRequest(JSON.stringify({ site_id: 'test', event_type: 'click_mail' })),
    )
    expect(res.status).toBe(422)
    expect(await res.json()).toMatchObject({ error: expect.stringContaining('site_id') })
  })
})
