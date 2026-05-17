// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import type {
  BookingScheduleFile,
  SessionPayload,
  WeeklyHoursRow,
} from '@/types/admin'

const hoisted = vi.hoisted(() => {
  const FULL_WEEK: WeeklyHoursRow[] = [
    { day: 'mon', open: true, from: '09:00', to: '21:00' },
    { day: 'tue', open: true, from: '09:00', to: '21:00' },
    { day: 'wed', open: true, from: '09:00', to: '21:00' },
    { day: 'thu', open: true, from: '09:00', to: '21:00' },
    { day: 'fri', open: true, from: '09:00', to: '21:00' },
    { day: 'sat', open: true, from: '09:00', to: '21:00' },
    { day: 'sun', open: false, from: '09:00', to: '18:00' },
  ]

  return {
    FULL_WEEK,
    requireAdminSession: vi.fn(),
    readBookingSchedule: vi.fn(),
    writeBookingSchedule: vi.fn(),
  }
})

vi.mock('@/lib/require-admin', () => ({
  requireAdminSession: hoisted.requireAdminSession,
}))

vi.mock('@/lib/booking-schedule-db', () => ({
  DEFAULT_WEEKLY: hoisted.FULL_WEEK,
  readBookingSchedule: hoisted.readBookingSchedule,
  writeBookingSchedule: hoisted.writeBookingSchedule,
}))

import {
  DELETE,
  GET,
  POST,
  PUT,
} from '@/app/api/admin/schedule/route'

function jsonReq(method: string, body?: unknown, search = '') {
  return new NextRequest(`http://localhost/api/admin/schedule${search}`, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

describe('/api/admin/schedule', () => {
  const session: SessionPayload = {
    email: 'a@a.com',
    clientId: 'c',
    exp: Date.now() + 1e9,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    hoisted.requireAdminSession.mockReturnValue(session)
    hoisted.readBookingSchedule.mockResolvedValue({
      weekly: hoisted.FULL_WEEK,
      exceptions: [],
    })
    hoisted.writeBookingSchedule.mockResolvedValue(undefined)
  })

  describe('GET', () => {
    it('blocks unauthenticated callers', async () => {
      hoisted.requireAdminSession.mockReturnValueOnce(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      )
      const res = await GET(jsonReq('GET'))
      expect(res.status).toBe(401)
    })

    it('returns the hydrated schedule blob', async () => {
      const schedule: BookingScheduleFile = {
        weekly: hoisted.FULL_WEEK,
        exceptions: [{ id: 'ex1', date: '2026-05-20', closed: true }],
      }
      hoisted.readBookingSchedule.mockResolvedValueOnce(schedule)
      const res = await GET(jsonReq('GET'))
      expect(res.status).toBe(200)
      expect(await res.json()).toEqual(schedule)
    })
  })

  describe('PUT', () => {
    it('returns 400 for invalid JSON payloads', async () => {
      const req = new NextRequest('http://localhost/api/admin/schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: '{"weekly"',
      })
      const res = await PUT(req)
      expect(res.status).toBe(400)
    })

    it.each([
      [{ weekly: 'x' }],
      [{ weekly: hoisted.FULL_WEEK.slice(0, 6) }],
      [
        {
          weekly: [...hoisted.FULL_WEEK, hoisted.FULL_WEEK[0]!],
        },
      ],
      [
        {
          weekly: hoisted.FULL_WEEK.map((r, idx) =>
            idx === 0 ? { ...r, open: true, from: '21:00', to: '09:00' } : r,
          ),
        },
      ],
    ])('returns 422 when weekly validation fails %#', async (body) => {
      const res = await PUT(jsonReq('PUT', body))
      expect(res.status).toBe(422)
      expect(hoisted.writeBookingSchedule).not.toHaveBeenCalled()
    })

    it('returns 422 when a weekday repeats', async () => {
      const weekly = [...hoisted.FULL_WEEK]
      weekly[1] = {
        ...weekly[1]!,
        day: 'mon',
      }
      const res = await PUT(jsonReq('PUT', { weekly }))
      expect(res.status).toBe(422)
    })

    it('writes weekly overrides while cloning existing exceptions', async () => {
      hoisted.readBookingSchedule.mockResolvedValueOnce({
        weekly: hoisted.FULL_WEEK,
        exceptions: [{ id: 'legacy', date: '2026-05-03', closed: true }],
      })
      const res = await PUT(jsonReq('PUT', { weekly: hoisted.FULL_WEEK }))
      expect(res.status).toBe(200)
      expect(hoisted.writeBookingSchedule).toHaveBeenCalledWith({
        weekly: hoisted.FULL_WEEK,
        exceptions: [{ id: 'legacy', date: '2026-05-03', closed: true }],
      })
      const json = (await res.json()) as {
        schedule: BookingScheduleFile
        ok?: boolean
      }
      expect(json.ok).toBe(true)
      expect(json.schedule.exceptions).toHaveLength(1)
    })

    it('returns 500 when persistence rejects', async () => {
      hoisted.writeBookingSchedule.mockRejectedValueOnce(new Error('io'))
      const res = await PUT(jsonReq('PUT', { weekly: hoisted.FULL_WEEK }))
      expect(res.status).toBe(500)
    })
  })

  describe('POST exceptions', () => {
    it('persists explicit closed days', async () => {
      const res = await POST(jsonReq('POST', { date: '2026-05-20', closed: true }))
      expect(res.status).toBe(200)
      const payload = hoisted.writeBookingSchedule.mock.calls[0]![0]!
      expect(payload.exceptions).toHaveLength(1)
      expect(payload.exceptions[0]).toMatchObject({
        closed: true,
        date: '2026-05-20',
      })
    })

    it('allows custom intra-day windows when hours are coherent', async () => {
      const res = await POST(
        jsonReq('POST', { date: '2026-06-07', closed: false, from: '10:00', to: '16:30' }),
      )
      expect(res.status).toBe(200)
      const payload = hoisted.writeBookingSchedule.mock.calls.at(-1)![0]!
      expect(payload.exceptions.at(-1)).toMatchObject({
        closed: false,
        date: '2026-06-07',
        from: '10:00',
        to: '16:30',
      })
    })

    it('returns 422 for malformed calendar literals', async () => {
      const res = await POST(jsonReq('POST', { date: 'not-calendar', closed: true }))
      expect(res.status).toBe(422)
    })

    it('returns 422 for reversed custom intervals', async () => {
      const res = await POST(
        jsonReq('POST', { date: '2026-06-06', closed: false, from: '18:00', to: '09:30' }),
      )
      expect(res.status).toBe(422)
    })

    it('falls back to DEFAULT_WEEKLY when current weekly lacks seven slots', async () => {
      hoisted.readBookingSchedule.mockResolvedValueOnce({
        weekly: hoisted.FULL_WEEK.slice(0, 2),
        exceptions: [{ id: 'keep', date: '2026-05-06', closed: true }],
      })
      await POST(jsonReq('POST', { date: '2026-05-07', closed: true }))
      const payload = hoisted.writeBookingSchedule.mock.calls.at(-1)![0]!
      expect(payload.weekly).toEqual(hoisted.FULL_WEEK)
      expect(payload.exceptions).toContainEqual(expect.objectContaining({ date: '2026-05-06' }))
    })

    it('returns 400 for invalid JSON payloads', async () => {
      const req = new NextRequest('http://localhost/api/admin/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"date"',
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
    })

    it('returns 500 when writes fail after validation', async () => {
      hoisted.writeBookingSchedule.mockRejectedValueOnce(new Error('disk'))
      const res = await POST(jsonReq('POST', { date: '2026-05-18', closed: true }))
      expect(res.status).toBe(500)
    })
  })

  describe('DELETE exceptions', () => {
    it('requires an id parameter', async () => {
      const res = await DELETE(jsonReq('DELETE'))
      expect(res.status).toBe(400)
    })

    it('returns 404 when the exception id cannot be matched', async () => {
      hoisted.readBookingSchedule.mockResolvedValueOnce({
        weekly: hoisted.FULL_WEEK,
        exceptions: [{ id: 'a', date: '2026-05-06', closed: true }],
      })
      const res = await DELETE(jsonReq('DELETE', undefined, '?id=missing'))
      expect(res.status).toBe(404)
    })

    it('drops the referenced exception atomically', async () => {
      const exceptions = [
        { id: 'keep', date: '2026-05-06', closed: true as const },
        { id: 'drop', date: '2026-05-07', closed: false, from: '12:00', to: '15:00' },
      ]
      hoisted.readBookingSchedule.mockResolvedValueOnce({
        weekly: hoisted.FULL_WEEK,
        exceptions,
      })
      const res = await DELETE(jsonReq('DELETE', undefined, '?id=drop'))
      expect(res.status).toBe(200)
      expect(hoisted.writeBookingSchedule).toHaveBeenCalledWith({
        weekly: hoisted.FULL_WEEK,
        exceptions: [exceptions[0]],
      })
    })

    it('returns 500 when persistence fails mid-delete', async () => {
      hoisted.readBookingSchedule.mockResolvedValueOnce({
        weekly: hoisted.FULL_WEEK,
        exceptions: [{ id: 'x', date: '2026-05-06', closed: true }],
      })
      hoisted.writeBookingSchedule.mockRejectedValueOnce(new Error('boom'))
      const res = await DELETE(jsonReq('DELETE', undefined, '?id=x'))
      expect(res.status).toBe(500)
    })
  })
})
