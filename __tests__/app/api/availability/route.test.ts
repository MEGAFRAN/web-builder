// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { BOOKING_SLOT_GRID } from '@/lib/booking-slot-grid'

const readFileMock = vi.hoisted(() => vi.fn())
const readBookingScheduleMock = vi.hoisted(() => vi.fn())

vi.mock('fs', () => ({
  promises: {
    readFile: readFileMock,
  },
  default: {},
}))

vi.mock('@/lib/booking-schedule-db', () => ({
  readBookingSchedule: readBookingScheduleMock,
}))

import { GET } from '@/app/api/availability/route'

const ALL_SLOTS = BOOKING_SLOT_GRID as readonly string[]

const WEEKLY = [
  { day: 'mon' as const, open: true, from: '09:00', to: '21:00' },
  { day: 'tue' as const, open: true, from: '09:00', to: '21:00' },
  { day: 'wed' as const, open: true, from: '09:00', to: '21:00' },
  { day: 'thu' as const, open: true, from: '09:00', to: '21:00' },
  { day: 'fri' as const, open: true, from: '09:00', to: '21:00' },
  { day: 'sat' as const, open: true, from: '09:00', to: '21:00' },
  { day: 'sun' as const, open: false, from: '09:00', to: '18:00' },
]

describe('GET /api/availability', () => {
  const shopId = 'client-shop'
  const mondayIso = '2026-05-18'

  function request(pathOnly: string) {
    const url = pathOnly.startsWith('http')
      ? pathOnly
      : `http://localhost${pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`}`
    return new NextRequest(url)
  }

  beforeEach(() => {
    vi.clearAllMocks()
    readBookingScheduleMock.mockResolvedValue({
      weekly: WEEKLY,
      exceptions: [],
    })
    readFileMock.mockResolvedValue(JSON.stringify([]))
  })

  it.each([
    'http://localhost/api/availability',
    `http://localhost/api/availability?clientId=${shopId}`,
    `http://localhost/api/availability?date=${encodeURIComponent(mondayIso)}`,
    `http://localhost/api/availability?clientId=${shopId}&date=2026-5-06`,
    `http://localhost/api/availability?clientId=${shopId}&date=${mondayIso}&duration=x`,
    `http://localhost/api/availability?clientId=${shopId}&date=${mondayIso}&duration=0`,
    `http://localhost/api/availability?clientId=${shopId}&date=${mondayIso}&duration=${1441}`,
  ])('responds with 400 %#', async (url) => {
    const res = await GET(new NextRequest(url))
    expect(res.status).toBe(400)
  })

  it('defaults ambiguous duration omission to sixty minutes', async () => {
    const urlBase = `/api/availability?clientId=${shopId}&date=${mondayIso}`
    const resNoDur = await GET(request(`${urlBase}`))
    expect(resNoDur.status).toBe(200)
    const resDur60 = await GET(request(`${urlBase}&duration=60`))
    expect(resDur60.status).toBe(200)
    const a = await resNoDur.json()
    const b = await resDur60.json()
    expect(a).toEqual(b)
    expect(readFileMock).toHaveBeenCalledTimes(2)
  })

  it('marks every enumerated slot unavailable on shuttered weekdays', async () => {
    const closedSunday = '2026-05-17'
    const res = await GET(
      request(`/api/availability?clientId=${shopId}&date=${closedSunday}&duration=30`),
    )
    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toBe('no-store')
    const payload = await res.json() as {
      bookedSlots: string[]
      outOfWindowSlots: string[]
    }
    expect(payload.bookedSlots).toEqual([])
    expect(payload.outOfWindowSlots.sort()).toEqual([...ALL_SLOTS].sort())
  })

  it('retains trailing slots whenever they cannot fit closing hours', async () => {
    const res = await GET(
      request(`/api/availability?clientId=${shopId}&date=${mondayIso}&duration=60`),
    )
    expect(res.status).toBe(200)
    const { bookedSlots, outOfWindowSlots } = (await res.json()) as {
      bookedSlots: string[]
      outOfWindowSlots: string[]
    }
    expect(outOfWindowSlots).toContain('21:00')
    expect(bookedSlots).not.toContain('21:00')
  })

  it('suppresses overlaps with persisted reservations belonging to this tenant', async () => {
    readFileMock.mockResolvedValueOnce(
      JSON.stringify([
        {
          clientId: shopId,
          date: mondayIso,
          time: '09:30',
          durationMinutes: 120,
          status: 'confirmed',
        },
      ]),
    )

    const res = await GET(
      request(`/api/availability?clientId=${shopId}&date=${mondayIso}&duration=90`),
    )
    expect(res.status).toBe(200)
    const { bookedSlots, outOfWindowSlots } = (await res.json()) as {
      bookedSlots: string[]
      outOfWindowSlots: string[]
    }
    expect(bookedSlots).toContain('09:00')
    expect(outOfWindowSlots).not.toContain('09:00')
  })

  it('ignores cancellations when scanning conflicts', async () => {
    readFileMock.mockResolvedValueOnce(
      JSON.stringify([
        {
          clientId: shopId,
          date: mondayIso,
          time: '10:30',
          durationMinutes: 60,
          status: 'cancelled',
        },
      ]),
    )

    const res = await GET(
      request(`/api/availability?clientId=${shopId}&date=${mondayIso}&duration=60`),
    )
    expect(res.status).toBe(200)
    const { bookedSlots } = (await res.json()) as {
      bookedSlots: string[]
      outOfWindowSlots: string[]
    }
    expect(bookedSlots).not.toContain('10:30')
  })

  it('never places the same slot in bookedSlots and outOfWindowSlots', async () => {
    readFileMock.mockResolvedValueOnce(
      JSON.stringify([
        {
          clientId: shopId,
          date: mondayIso,
          time: '14:00',
          durationMinutes: 60,
          status: 'confirmed',
        },
      ]),
    )

    const res = await GET(
      request(`/api/availability?clientId=${shopId}&date=${mondayIso}&duration=60`),
    )
    expect(res.status).toBe(200)
    const { bookedSlots, outOfWindowSlots } = (await res.json()) as {
      bookedSlots: string[]
      outOfWindowSlots: string[]
    }
    const bookedSet = new Set(bookedSlots)
    for (const s of outOfWindowSlots) {
      expect(bookedSet.has(s)).toBe(false)
    }
  })
})

describe('availability API — split response', () => {
  const shopId = 'split-client'
  const mondayIso = '2026-05-18'

  function request(pathOnly: string) {
    const url = pathOnly.startsWith('http')
      ? pathOnly
      : `http://localhost${pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`}`
    return new NextRequest(url)
  }

  beforeEach(() => {
    vi.clearAllMocks()
    readBookingScheduleMock.mockResolvedValue({
      weekly: WEEKLY,
      exceptions: [],
    })
    readFileMock.mockResolvedValue(JSON.stringify([]))
  })

  it('returns bookedSlots and outOfWindowSlots as separate arrays', async () => {
    const res = await GET(
      request(`/api/availability?clientId=${shopId}&date=${mondayIso}&duration=60`),
    )
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      bookedSlots: string[]
      outOfWindowSlots: string[]
    }
    expect(Array.isArray(body.bookedSlots)).toBe(true)
    expect(Array.isArray(body.outOfWindowSlots)).toBe(true)
    expect(body).not.toHaveProperty('error')
  })

  it('a slot cannot appear in both arrays', async () => {
    readFileMock.mockResolvedValueOnce(
      JSON.stringify([
        {
          clientId: shopId,
          date: mondayIso,
          time: '14:00',
          durationMinutes: 60,
          status: 'confirmed',
        },
      ]),
    )

    const res = await GET(
      request(`/api/availability?clientId=${shopId}&date=${mondayIso}&duration=60`),
    )
    expect(res.status).toBe(200)
    const { bookedSlots, outOfWindowSlots } = (await res.json()) as {
      bookedSlots: string[]
      outOfWindowSlots: string[]
    }
    const oow = new Set(outOfWindowSlots)
    const both = bookedSlots.filter(s => oow.has(s))
    expect(both).toEqual([])
  })

  it('out-of-window slots are those where start + duration exceeds close time', async () => {
    const res = await GET(
      request(`/api/availability?clientId=${shopId}&date=${mondayIso}&duration=60`),
    )
    expect(res.status).toBe(200)
    const { outOfWindowSlots } = (await res.json()) as {
      bookedSlots: string[]
      outOfWindowSlots: string[]
    }
    // Monday 09:00–21:00: 21:00 + 60 min extends past close
    expect(outOfWindowSlots).toContain('21:00')
  })

  it('booked slots are only in-window slots that conflict with a booking', async () => {
    readFileMock.mockResolvedValueOnce(
      JSON.stringify([
        {
          clientId: shopId,
          date: mondayIso,
          time: '14:00',
          durationMinutes: 60,
          status: 'confirmed',
        },
      ]),
    )

    const res = await GET(
      request(`/api/availability?clientId=${shopId}&date=${mondayIso}&duration=60`),
    )
    expect(res.status).toBe(200)
    const { bookedSlots, outOfWindowSlots } = (await res.json()) as {
      bookedSlots: string[]
      outOfWindowSlots: string[]
    }

    expect(bookedSlots).toContain('14:00')
    expect(outOfWindowSlots).not.toContain('14:00')

    expect(outOfWindowSlots).toContain('21:00')
    expect(bookedSlots).not.toContain('21:00')
  })
})
