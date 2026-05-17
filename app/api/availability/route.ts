import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { BOOKING_SLOT_GRID } from '@/lib/booking-slot-grid'
import { readBookingSchedule } from '@/lib/booking-schedule-db'
import { slotFitsScheduleWindow } from '@/lib/booking-schedule-window'

const SLOT_GRID = BOOKING_SLOT_GRID

interface ReservationRecord {
  clientId: string
  date: string
  time: string
  status: string
  durationMinutes?: number
  /** Legacy table bookings — assumed 60 minutes when durationMinutes absent */
  partySize?: number
}

const DB_PATH = path.join(process.cwd(), 'data', 'reservations-local.json')

async function readRecords(): Promise<ReservationRecord[]> {
  try {
    const raw = await fs.readFile(DB_PATH, 'utf-8')
    return JSON.parse(raw) as ReservationRecord[]
  } catch {
    return []
  }
}

function parseDurationMinutes(param: string | null): number | null {
  if (param === null || param === '') {
    return 60
  }
  const n = Number.parseInt(param, 10)
  if (!Number.isFinite(n) || n < 1 || n > 24 * 60) {
    return null
  }
  return n
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function overlaps(aStart: number, aDur: number, bStart: number, bDur: number): boolean {
  const aEnd = aStart + aDur
  const bEnd = bStart + bDur
  return aStart < bEnd && bStart < aEnd
}

function bookingDurationMinutes(record: ReservationRecord): number {
  if (typeof record.durationMinutes === 'number' && record.durationMinutes > 0) {
    return record.durationMinutes
  }
  return 60
}

function slotConflictsWithBookings(
  slotStart: string,
  requestedDuration: number,
  records: ReservationRecord[],
  clientId: string,
  date: string,
): boolean {
  const slotMin = timeToMinutes(slotStart)
  for (const r of records) {
    if (
      r.clientId !== clientId ||
      r.date !== date ||
      r.status === 'cancelled' ||
      r.status === 'no-show'
    ) {
      continue
    }
    const bookDur = bookingDurationMinutes(r)
    const bookMin = timeToMinutes(r.time)
    if (overlaps(slotMin, requestedDuration, bookMin, bookDur)) {
      return true
    }
  }
  return false
}

export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get('clientId')
  const date = req.nextUrl.searchParams.get('date')
  const durationRaw = req.nextUrl.searchParams.get('duration')

  if (!clientId || !date) {
    return NextResponse.json(
      { error: 'clientId and date query parameters are required.' },
      { status: 400 }
    )
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: 'date must be in YYYY-MM-DD format.' },
      { status: 400 }
    )
  }

  const requestedDuration = parseDurationMinutes(durationRaw)
  if (requestedDuration === null) {
    return NextResponse.json(
      { error: 'duration must be a positive integer (minutes), at most 1440.' },
      { status: 400 }
    )
  }

  const records = await readRecords()
  const schedule = await readBookingSchedule()

  const bookedSlots = SLOT_GRID.filter(slot => {
    const slotMin = timeToMinutes(slot)
    if (!slotFitsScheduleWindow(schedule, date, slotMin, requestedDuration)) {
      return true
    }
    return slotConflictsWithBookings(slot, requestedDuration, records, clientId, date)
  })

  return NextResponse.json(
    { bookedSlots },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
