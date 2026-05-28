// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import type { SessionPayload, StoredReservation } from '@/types/admin'

const requireAdminSessionMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/require-admin', () => ({
  requireAdminSession: requireAdminSessionMock,
}))

vi.mock('@/lib/reservations-db', () => ({
  updateReservation: vi.fn(),
}))

import { PATCH } from '@/app/api/admin/reservations/[id]/route'
import { updateReservation } from '@/lib/reservations-db'

const session: SessionPayload = {
  email: 'a@a.com',
  clientId: 'test-client',
  exp: Date.now() + 1e9,
}

function patchReq(body: unknown) {
  return new NextRequest('http://localhost/api/admin/reservations/r1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

describe('PATCH /api/admin/reservations/[id]', () => {
  const savedClientId = process.env.CLIENT_ID

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.CLIENT_ID = 'test-client'
    requireAdminSessionMock.mockReturnValue(session)
  })

  afterEach(() => {
    process.env.CLIENT_ID = savedClientId
  })

  function ctx(id: string) {
    return { params: Promise.resolve({ id }) }
  }

  it('returns 401 when the admin gate fails', async () => {
    requireAdminSessionMock.mockReturnValueOnce(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    )
    const res = await PATCH(patchReq({ action: 'cancel' }), ctx('rid'))
    expect(res.status).toBe(401)
  })

  it('returns 400 when JSON is malformed', async () => {
    const req = new NextRequest('http://localhost/api/admin/reservations/x', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: '{"action"',
    })
    const res = await PATCH(req, ctx('x'))
    expect(res.status).toBe(400)
  })

  it.each([
    ['missing action field', {}],
    ['unsupported action string', { action: 'confirm' }],
  ] as const)('returns 422 when %s', async (_label, body) => {
    const res = await PATCH(patchReq(body), ctx('x'))
    expect(res.status).toBe(422)
  })

  it('returns 404 when the updater finds no reservation', async () => {
    vi.mocked(updateReservation).mockResolvedValueOnce(null)
    const res = await PATCH(patchReq({ action: 'cancel' }), ctx('missing'))
    expect(res.status).toBe(404)
  })

  it('decodes the route id segment before handing it to the database layer', async () => {
    vi.mocked(updateReservation).mockResolvedValueOnce(
      row({ id: 'client-r/1', status: 'cancelled', cancelReason: null }),
    )
    const encoded = encodeURIComponent('client-r/1')
    const res = await PATCH(patchReq({ action: 'cancel' }), ctx(encoded))
    expect(res.status).toBe(200)
    expect(updateReservation).toHaveBeenCalledWith(
      'client-r/1',
      'test-client',
      expect.any(Function),
    )
  })

  it('applies cancellation with optional trimmed reason', async () => {
    vi.mocked(updateReservation).mockImplementationOnce((_id, _cid, updater) =>
      Promise.resolve(updater(row({ id: 'rid' }))),
    )

    const res = await PATCH(
      patchReq({ action: 'cancel', reason: ' weather ' }),
      ctx('rid'),
    )
    expect(res.status).toBe(200)
    const json = (await res.json()) as { reservation: StoredReservation }
    expect(json.reservation.status).toBe('cancelled')
    expect(json.reservation.cancelReason).toBe('weather')
  })

  it('applies no-show without injecting cancelReason semantics', async () => {
    vi.mocked(updateReservation).mockImplementationOnce((_id, _cid, updater) =>
      Promise.resolve(updater(row({ id: 'nid' }))),
    )

    const res = await PATCH(patchReq({ action: 'no-show' }), ctx('nid'))
    expect(res.status).toBe(200)
    const json = (await res.json()) as { reservation: StoredReservation }
    expect(json.reservation.status).toBe('no-show')
  })

  it('applies complete status', async () => {
    vi.mocked(updateReservation).mockImplementationOnce((_id, _cid, updater) =>
      Promise.resolve(updater(row({ id: 'cid' }))),
    )

    const res = await PATCH(patchReq({ action: 'complete' }), ctx('cid'))
    expect(res.status).toBe(200)
    const json = (await res.json()) as { reservation: StoredReservation }
    expect(json.reservation.status).toBe('completed')
  })
})

function row(overrides: Partial<StoredReservation> = {}): StoredReservation {
  return {
    id: 'rid',
    clientId: 'test-client',
    name: 'Ada',
    email: 'a@example.com',
    phone: '1',
    date: '2026-05-06',
    time: '09:00',
    status: 'confirmed',
    createdAt: '2026-01-01',
    cancelReason: null,
    notes: null,
    ...overrides,
  }
}
