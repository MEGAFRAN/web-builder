// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import type { AdminBookingService, SessionPayload, StoredReservation } from '@/types/admin'
import { suppressConsoleErrorDuring } from '../../../../suppressConsoleErrorDuring'

const requireAdminSessionMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/require-admin', () => ({
  requireAdminSession: requireAdminSessionMock,
}))

vi.mock('@/lib/reservations-db', () => ({
  readReservations: vi.fn(),
  appendReservation: vi.fn(),
}))

vi.mock('@/lib/booking-services-db', () => ({
  readBookingServices: vi.fn(),
}))

import { GET, POST } from '@/app/api/admin/reservations/route'
import { readReservations, appendReservation } from '@/lib/reservations-db'
import { readBookingServices } from '@/lib/booking-services-db'

const session: SessionPayload = {
  email: 'a@a.com',
  clientId: 'test-client',
  exp: Date.now() + 1e9,
}

const svcHair: AdminBookingService = {
  id: 'hair',
  name: 'Cut',
  description: '',
  durationMinutes: 30,
  price: 40,
  currency: 'usd',
}

function adminGet(url: string) {
  return new NextRequest(url)
}

function adminPost(body: unknown) {
  return new NextRequest('http://localhost/api/admin/reservations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

describe('/api/admin/reservations', () => {
  const savedClientId = process.env.CLIENT_ID

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.CLIENT_ID = 'test-client'
    requireAdminSessionMock.mockReturnValue(session)
    vi.mocked(readBookingServices).mockResolvedValue([svcHair])
  })

  afterEach(() => {
    process.env.CLIENT_ID = savedClientId
  })

  describe('GET', () => {
    it('returns 401 when requireAdmin rejects the session', async () => {
      requireAdminSessionMock.mockReturnValueOnce(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      )
      const res = await GET(
        adminGet('http://localhost/api/admin/reservations?startDate=2026-05-01&endDate=2026-05-31'),
      )
      expect(res.status).toBe(401)
    })

    it.each([
      ['missing params', '/api/admin/reservations'],
      ['missing endDate', '/api/admin/reservations?startDate=2026-05-01'],
      ['missing startDate', '/api/admin/reservations?endDate=2026-05-31'],
      ['invalid startDate shape', '/api/admin/reservations?startDate=2026-5-01&endDate=2026-05-02'],
      ['invalid endDate shape', '/api/admin/reservations?startDate=2026-05-01&endDate=05-02-2026'],
    ] as const)('returns 400 when %s', async (_label, pathname) => {
      const res = await GET(adminGet(`http://localhost${pathname}`))
      expect(res.status).toBe(400)
      const json = (await res.json()) as { error?: string }
      expect(json.error).toContain('startDate')
    })

    it('returns reservations enriched with service names inside the requested window', async () => {
      const rows: StoredReservation[] = [
        {
          id: 'x',
          clientId: 'test-client',
          serviceId: 'hair',
          durationMinutes: 30,
          name: 'Ada',
          email: 'ada@example.com',
          phone: '1',
          date: '2026-05-10',
          time: '09:30',
          status: 'confirmed',
          createdAt: 'iso',
          notes: null,
        },
        {
          id: 'other-client',
          clientId: 'other',
          serviceId: 'hair',
          durationMinutes: 30,
          name: 'Ignored',
          email: 'ig@example.com',
          phone: '1',
          date: '2026-05-15',
          time: '10:00',
          status: 'confirmed',
          createdAt: 'iso',
        },
        {
          id: 'out-window',
          clientId: 'test-client',
          serviceId: 'hair',
          durationMinutes: 30,
          name: 'Late',
          email: 'l@example.com',
          phone: '1',
          date: '2026-06-01',
          time: '11:00',
          status: 'confirmed',
          createdAt: 'iso',
        },
      ]
      vi.mocked(readReservations).mockResolvedValueOnce(rows)

      const res = await GET(
        adminGet('http://localhost/api/admin/reservations?startDate=2026-05-01&endDate=2026-05-31'),
      )
      expect(res.status).toBe(200)
      const json = (await res.json()) as {
        reservations: Array<{ id: string; serviceName?: string }>
      }
      expect(json.reservations).toHaveLength(1)
      expect(json.reservations[0]).toMatchObject({ id: 'x', serviceName: 'Cut' })
    })

    it('uses the raw service id as the label when unknown', async () => {
      vi.mocked(readReservations).mockResolvedValueOnce([
        {
          id: 'x',
          clientId: 'test-client',
          serviceId: 'missing',
          name: 'Ada',
          email: 'ada@example.com',
          phone: '1',
          date: '2026-05-05',
          time: '09:00',
          status: 'confirmed',
          createdAt: 'iso',
        },
      ])
      const res = await GET(
        adminGet('http://localhost/api/admin/reservations?startDate=2026-05-01&endDate=2026-05-07'),
      )
      expect(res.status).toBe(200)
      const json = (await res.json()) as {
        reservations: Array<{ serviceName: string | null }>
      }
      expect(json.reservations[0]?.serviceName).toBe('missing')
    })

    it('sorts by date then time', async () => {
      vi.mocked(readReservations).mockResolvedValueOnce([
        {
          id: 'b',
          clientId: 'test-client',
          serviceId: 'hair',
          name: '',
          email: '',
          phone: '',
          date: '2026-05-02',
          time: '12:00',
          status: 'confirmed',
          createdAt: '',
        },
        {
          id: 'a',
          clientId: 'test-client',
          serviceId: 'hair',
          name: '',
          email: '',
          phone: '',
          date: '2026-05-02',
          time: '09:30',
          status: 'confirmed',
          createdAt: '',
        },
      ])
      const res = await GET(
        adminGet('http://localhost/api/admin/reservations?startDate=2026-05-01&endDate=2026-05-10'),
      )
      const json = (await res.json()) as { reservations: Array<{ id: string }> }
      expect(json.reservations.map((r) => r.id)).toEqual(['a', 'b'])
    })
  })

  describe('POST', () => {
    const validManual = {
      serviceId: 'hair',
      date: '2026-05-22',
      time: ' 10:00 ',
      name: 'Bob',
      email: ' bob@example.com ',
      phone: ' 555 ',
      notes: ' note ',
    }

    it('returns 401 when admin session fails', async () => {
      requireAdminSessionMock.mockReturnValueOnce(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      )
      const res = await POST(adminPost(validManual))
      expect(res.status).toBe(401)
    })

    it('returns 400 when JSON parsing fails', async () => {
      const req = new NextRequest('http://localhost/api/admin/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"serviceId"',
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
    })

    it.each([
      [{ serviceId: '' }, 'empty serviceId'],
      [{ date: '2026/05/05' }, 'non-ISO date'],
      [{ name: '', email: 'a@b.co', phone: '1', serviceId: 'hair', date: '2026-05-05', time: '09:00' }, 'empty name'],
    ] as const)('returns 422 when payload fails validation (%s)', async (partial) => {
      const res = await POST(adminPost({ ...validManual, ...partial }))
      expect(res.status).toBe(422)
    })

    it('returns 422 when the requested service does not exist', async () => {
      const res = await POST(adminPost({ ...validManual, serviceId: 'nope' }))
      expect(res.status).toBe(422)
      const json = (await res.json()) as { error?: string }
      expect(json.error).toContain('Unknown service')
      expect(vi.mocked(appendReservation)).not.toHaveBeenCalled()
    })

    it('returns 500 when persistence fails', async () => {
      await suppressConsoleErrorDuring(async () => {
        vi.mocked(appendReservation).mockRejectedValueOnce(new Error('disk full'))
        const res = await POST(adminPost(validManual))
        expect(res.status).toBe(500)
      })
    })

    it('persists and returns ok with a generated id', async () => {
      vi.mocked(appendReservation).mockResolvedValueOnce(undefined)

      const res = await POST(adminPost(validManual))
      expect(res.status).toBe(200)
      const json = (await res.json()) as { ok?: boolean; id?: string }
      expect(json.ok).toBe(true)
      expect(json.id).toMatch(/^test-client-\d+-[a-z0-9]+$/)
      expect(appendReservation).toHaveBeenCalledTimes(1)
      const saved = vi.mocked(appendReservation).mock.calls[0]![0]!
      expect(saved).toMatchObject({
        clientId: 'test-client',
        serviceId: 'hair',
        durationMinutes: 30,
        name: 'Bob',
        email: 'bob@example.com',
        phone: '555',
        notes: 'note',
        status: 'confirmed',
      })
    })
  })
})
