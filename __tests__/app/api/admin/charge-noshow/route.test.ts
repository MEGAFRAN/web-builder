// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import type { AdminBookingService, SessionPayload, StoredReservation } from '@/types/admin'

const requireAdminSessionMock = vi.hoisted(() => vi.fn())
const getClientConfigMock = vi.hoisted(() => vi.fn())
const chargeNoShowForClientMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/require-admin', () => ({
  requireAdminSession: requireAdminSessionMock,
}))

vi.mock('@/lib/client-config', () => ({
  getClientConfig: getClientConfigMock,
}))

vi.mock('@/lib/charge-noshow', () => ({
  chargeNoShowForClient: chargeNoShowForClientMock,
}))

vi.mock('@/lib/booking-services-db', () => ({
  readBookingServices: vi.fn(),
}))

vi.mock('@/lib/reservations-db', () => ({
  readReservations: vi.fn(),
  writeReservations: vi.fn(),
}))

import { POST } from '@/app/api/admin/charge-noshow/route'
import { readBookingServices } from '@/lib/booking-services-db'
import { readReservations, writeReservations } from '@/lib/reservations-db'

describe('POST /api/admin/charge-noshow', () => {
  const session: SessionPayload = {
    email: 'owner@example.com',
    clientId: 'client-x',
    exp: Date.now() + 1e9,
  }

  const savedClientId = process.env.CLIENT_ID

  const bookingSettings = {
    enforceGuarantee: true,
    cancellationFeePercent: 50,
    currency: 'USD' as const,
  }

  const service: AdminBookingService = {
    id: 'haircut',
    name: 'Haircut',
    description: '',
    durationMinutes: 45,
    price: 80,
    currency: 'usd',
  }

  const reservation: StoredReservation = {
    id: 'res-1',
    clientId: 'client-x',
    serviceId: 'haircut',
    name: 'Ada',
    email: 'ada@example.com',
    phone: '+1',
    date: '2026-05-06',
    time: '09:00',
    status: 'no-show',
    createdAt: '2026-01-01',
    guarantee: {
      paymentMethodId: 'pm_123',
      customerId: 'cus_123',
      status: 'vaulted',
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.CLIENT_ID = 'client-x'
    requireAdminSessionMock.mockResolvedValue(session)
    getClientConfigMock.mockReturnValue({ bookingSettings })
    vi.mocked(readReservations).mockResolvedValue([reservation])
    vi.mocked(readBookingServices).mockResolvedValue([service])
    vi.mocked(writeReservations).mockResolvedValue(undefined)
    chargeNoShowForClientMock.mockResolvedValue({
      ok: true,
      status: 'cancelled_and_charged',
      amount: 40,
    })
  })

  afterEach(() => {
    process.env.CLIENT_ID = savedClientId
  })

  function post(body: unknown) {
    return new NextRequest('http://localhost/api/admin/charge-noshow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    })
  }

  it('returns 401 when the admin gate fails', async () => {
    requireAdminSessionMock.mockResolvedValueOnce(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    )
    const res = await POST(post({ reservationId: 'res-1' }))
    expect(res.status).toBe(401)
  })

  it('returns 500 when CLIENT_ID is not configured', async () => {
    delete process.env.CLIENT_ID
    const res = await POST(post({ reservationId: 'res-1' }))
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'CLIENT_ID not configured.' })
  })

  it('returns 400 when the body is not valid JSON', async () => {
    const res = await POST(post('{"reservationId"'))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Invalid JSON' })
  })

  it.each([
    ['missing reservationId', {}],
    ['blank reservationId', { reservationId: '   ' }],
  ] as const)('returns 422 when %s', async (_label, body) => {
    const res = await POST(post(body))
    expect(res.status).toBe(422)
    expect(await res.json()).toEqual({ error: 'reservationId is required.' })
  })

  it('returns 404 when client config lookup fails', async () => {
    getClientConfigMock.mockImplementationOnce(() => {
      throw new Error('missing config')
    })
    const res = await POST(post({ reservationId: 'res-1' }))
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Client config not found.' })
  })

  it('returns 422 when no-show guarantee is disabled', async () => {
    getClientConfigMock.mockReturnValueOnce({
      bookingSettings: { enforceGuarantee: false },
    })
    const res = await POST(post({ reservationId: 'res-1' }))
    expect(res.status).toBe(422)
    expect(await res.json()).toEqual({ error: 'No-show guarantee is not enabled.' })
  })

  it('returns 404 when the reservation does not exist for this client', async () => {
    vi.mocked(readReservations).mockResolvedValueOnce([])
    const res = await POST(post({ reservationId: 'missing' }))
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Reservation not found.' })
  })

  it('returns 422 when the reservation has no card on file', async () => {
    vi.mocked(readReservations).mockResolvedValueOnce([
      { ...reservation, guarantee: null },
    ])
    const res = await POST(post({ reservationId: 'res-1' }))
    expect(res.status).toBe(422)
    expect(await res.json()).toEqual({ error: 'This reservation has no card on file.' })
  })

  it('charges the no-show fee and persists the updated reservation', async () => {
    const res = await POST(post({ reservationId: 'res-1' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({
      ok: true,
      reservation: {
        ...reservation,
        status: 'cancelled_and_charged',
      },
    })
    expect(chargeNoShowForClientMock).toHaveBeenCalledWith({
      reservation,
      settings: bookingSettings,
      services: [service],
    })
    expect(writeReservations).toHaveBeenCalledWith([
      { ...reservation, status: 'cancelled_and_charged' },
    ])
  })

  it('returns 402 and stores the charge failure on the reservation', async () => {
    chargeNoShowForClientMock.mockResolvedValueOnce({
      ok: false,
      status: 'cancelled_charge_failed',
      error: 'Card declined.',
    })
    const res = await POST(post({ reservationId: 'res-1' }))
    expect(res.status).toBe(402)
    const body = await res.json()
    expect(body.error).toBe('Card declined.')
    expect(body.reservation).toMatchObject({
      id: 'res-1',
      status: 'cancelled_charge_failed',
      cancelReason: 'Card declined.',
    })
    expect(writeReservations).toHaveBeenCalledWith([
      {
        ...reservation,
        status: 'cancelled_charge_failed',
        cancelReason: 'Card declined.',
      },
    ])
  })
})
