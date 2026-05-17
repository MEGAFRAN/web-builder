// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import type { AdminBookingService, SessionPayload } from '@/types/admin'

const requireAdminSessionMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/require-admin', () => ({
  requireAdminSession: requireAdminSessionMock,
}))

vi.mock('@/lib/booking-services-db', () => ({
  readBookingServices: vi.fn(),
  writeBookingServices: vi.fn(),
}))

import { GET, PUT } from '@/app/api/admin/services/route'
import {
  readBookingServices,
  writeBookingServices,
} from '@/lib/booking-services-db'

describe('/api/admin/services', () => {
  const session: SessionPayload = {
    email: 'a@example.com',
    clientId: 'client',
    exp: Date.now() + 1e9,
  }

  const haircut: AdminBookingService = {
    id: 'hair',
    name: 'Haircut',
    description: '',
    durationMinutes: 45,
    price: 80,
    currency: 'usd',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    requireAdminSessionMock.mockReturnValue(session)
    vi.mocked(readBookingServices).mockResolvedValue([haircut])
    vi.mocked(writeBookingServices).mockResolvedValue(undefined)
  })

  it('requires an authenticated administrator', async () => {
    requireAdminSessionMock.mockReturnValueOnce(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    )
    const res = await GET(new NextRequest('http://localhost/api/admin/services'))
    expect(res.status).toBe(401)
  })

  it('reads the persisted catalog verbatim', async () => {
    const res = await GET(new NextRequest('http://localhost/api/admin/services'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ services: [haircut] })
  })

  describe('PUT', () => {
    function put(body: unknown) {
      return new NextRequest('http://localhost/api/admin/services', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: typeof body === 'string' ? body : JSON.stringify(body),
      })
    }

    it('parses malformed JSON cleanly', async () => {
      const req = put('{"services"')
      const res = await PUT(req)
      expect(res.status).toBe(400)
    })

    it.each([
      [{ services: haircut }, 'non-array envelope'],
      [
        {
          services: [
            {
              ...haircut,
              price: Infinity,
            },
          ],
        },
        'non-finite price',
      ],
      [
        {
          services: [
            {
              ...haircut,
              durationMinutes: 0,
            },
          ],
        },
        'durationMinutes below minimum',
      ],
    ])('returns 422 when %s (#%#)', async (body, _label) => {
      const res = await PUT(put(body))
      expect(res.status).toBe(422)
      expect(writeBookingServices).not.toHaveBeenCalled()
    })

    it('persists sanitized rows on success', async () => {
      const res = await PUT(put({ services: [haircut] }))
      expect(res.status).toBe(200)
      expect(await res.json()).toEqual({ ok: true })
      expect(writeBookingServices).toHaveBeenCalledWith([haircut])
    })

    it('returns 500 when persistence fails downstream', async () => {
      vi.mocked(writeBookingServices).mockRejectedValueOnce(new Error('locked'))
      const res = await PUT(put({ services: [haircut] }))
      expect(res.status).toBe(500)
    })
  })
})
