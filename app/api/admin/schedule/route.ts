import { NextRequest, NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/require-admin'
import {
  DEFAULT_WEEKLY,
  readBookingSchedule,
  writeBookingSchedule,
} from '@/lib/booking-schedule-db'
import { parseHm } from '@/lib/booking-schedule-utils'
import type {
  BookingScheduleFile,
  ScheduleException,
  WeeklyHoursRow,
} from '@/types/admin'

const DAY_CODES = new Set(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])

function isWeeklyRow(x: unknown): x is WeeklyHoursRow {
  if (typeof x !== 'object' || x === null) return false
  const o = x as Record<string, unknown>
  if (typeof o.day !== 'string' || !DAY_CODES.has(o.day)) return false
  if (typeof o.open !== 'boolean') return false
  if (typeof o.from !== 'string' || typeof o.to !== 'string') return false
  if (o.open) {
    const a = parseHm(o.from)
    const b = parseHm(o.to)
    if (a === null || b === null || b <= a) return false
  }
  return true
}

function isValidDateYmd(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const d = new Date(`${s}T12:00:00`)
  return !Number.isNaN(d.getTime())
}

export async function GET(req: NextRequest) {
  const gate = requireAdminSession(req)
  if (gate instanceof NextResponse) return gate

  const schedule = await readBookingSchedule()
  return NextResponse.json(schedule)
}

export async function PUT(req: NextRequest) {
  const gate = requireAdminSession(req)
  if (gate instanceof NextResponse) return gate

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const b = body as { weekly?: unknown }
  if (!Array.isArray(b.weekly) || b.weekly.length !== 7 || !b.weekly.every(isWeeklyRow)) {
    return NextResponse.json(
      { error: 'Expected weekly array of 7 valid day rows (mon–sun).' },
      { status: 422 },
    )
  }

  const seen = new Set<string>()
  for (const row of b.weekly) {
    if (seen.has(row.day)) {
      return NextResponse.json({ error: 'Duplicate weekday in weekly.' }, { status: 422 })
    }
    seen.add(row.day)
  }
  const requiredDays: WeeklyHoursRow['day'][] = [
    'mon',
    'tue',
    'wed',
    'thu',
    'fri',
    'sat',
    'sun',
  ]
  for (const code of requiredDays) {
    if (!seen.has(code)) {
      return NextResponse.json({ error: 'Weekly schedule must include Mon–Sun.' }, { status: 422 })
    }
  }

  const current = await readBookingSchedule()
  const next: BookingScheduleFile = {
    weekly: b.weekly,
    exceptions: current.exceptions,
  }

  try {
    await writeBookingSchedule(next)
  } catch (err) {
    console.error('[admin/schedule] weekly save failed:', err)
    return NextResponse.json({ error: 'Failed to save schedule.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, schedule: next })
}

export async function POST(req: NextRequest) {
  const gate = requireAdminSession(req)
  if (gate instanceof NextResponse) return gate

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const o = body as Record<string, unknown>
  const date = typeof o.date === 'string' ? o.date : ''
  const closed = o.closed === true
  const from = typeof o.from === 'string' ? o.from : ''
  const to = typeof o.to === 'string' ? o.to : ''

  if (!isValidDateYmd(date)) {
    return NextResponse.json({ error: 'Invalid date.' }, { status: 422 })
  }

  let exception: ScheduleException
  if (closed) {
    exception = {
      id: `ex-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      date,
      closed: true,
    }
  } else {
    const a = parseHm(from)
    const b = parseHm(to)
    if (a === null || b === null || b <= a) {
      return NextResponse.json({ error: 'Custom hours need valid from/to.' }, { status: 422 })
    }
    exception = {
      id: `ex-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      date,
      closed: false,
      from,
      to,
    }
  }

  const current = await readBookingSchedule()
  const others = current.exceptions.filter((e) => e.date !== date)
  const next: BookingScheduleFile = {
    weekly: current.weekly.length === 7 ? current.weekly : DEFAULT_WEEKLY,
    exceptions: [...others, exception],
  }

  try {
    await writeBookingSchedule(next)
  } catch (err) {
    console.error('[admin/schedule] exception add failed:', err)
    return NextResponse.json({ error: 'Failed to save exception.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, schedule: next })
}

export async function DELETE(req: NextRequest) {
  const gate = requireAdminSession(req)
  if (gate instanceof NextResponse) return gate

  const id = req.nextUrl.searchParams.get('id')
  if (!id || id.trim().length === 0) {
    return NextResponse.json({ error: 'Query id is required.' }, { status: 400 })
  }

  const current = await readBookingSchedule()
  const next: BookingScheduleFile = {
    weekly: current.weekly,
    exceptions: current.exceptions.filter((e) => e.id !== id),
  }

  if (next.exceptions.length === current.exceptions.length) {
    return NextResponse.json({ error: 'Exception not found.' }, { status: 404 })
  }

  try {
    await writeBookingSchedule(next)
  } catch (err) {
    console.error('[admin/schedule] exception delete failed:', err)
    return NextResponse.json({ error: 'Failed to delete exception.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, schedule: next })
}
