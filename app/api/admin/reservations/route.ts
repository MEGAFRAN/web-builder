import { NextRequest, NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/require-admin'
import {
  appendReservation,
  readReservations,
} from '@/lib/reservations-db'
import { readBookingServices } from '@/lib/booking-services-db'
import { resolveServiceDuration } from '@/lib/booking-catalog'
import type { StoredReservation } from '@/types/admin'

function parseIsoDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s)
}

interface ManualPayload {
  serviceId: string
  date: string
  time: string
  name: string
  email: string
  phone: string
  notes?: string
}

function isManualPayload(body: unknown): body is ManualPayload {
  if (typeof body !== 'object' || body === null) return false
  const b = body as Record<string, unknown>
  return (
    typeof b.serviceId === 'string' &&
    typeof b.date === 'string' &&
    typeof b.time === 'string' &&
    typeof b.name === 'string' &&
    typeof b.email === 'string' &&
    typeof b.phone === 'string' &&
    b.serviceId.trim().length > 0 &&
    b.name.trim().length > 0 &&
    b.email.trim().length > 0 &&
    b.phone.trim().length > 0 &&
    parseIsoDate(b.date)
  )
}

export async function GET(req: NextRequest) {
  const gate = await requireAdminSession(req)
  if (gate instanceof NextResponse) return gate

  const clientId = process.env.CLIENT_ID!
  const startDate = req.nextUrl.searchParams.get('startDate')
  const endDate = req.nextUrl.searchParams.get('endDate')

  if (!startDate || !endDate || !parseIsoDate(startDate) || !parseIsoDate(endDate)) {
    return NextResponse.json(
      { error: 'startDate and endDate query params (YYYY-MM-DD) are required.' },
      { status: 400 },
    )
  }

  const rows = await readReservations()
  const filtered = rows.filter(
    (r) => r.clientId === clientId && r.date >= startDate && r.date <= endDate,
  )

  filtered.sort((a, b) => {
    const dt = a.date.localeCompare(b.date)
    if (dt !== 0) return dt
    return a.time.localeCompare(b.time)
  })

  const services = await readBookingServices()
  const svcMap = new Map(services.map((s) => [s.id, s]))

  const enriched = filtered.map((r) => ({
    ...r,
    serviceName:
      r.serviceId && svcMap.has(r.serviceId)
        ? svcMap.get(r.serviceId)!.name
        : r.serviceId ?? null,
  }))

  return NextResponse.json({ reservations: enriched })
}

export async function POST(req: NextRequest) {
  const gate = await requireAdminSession(req)
  if (gate instanceof NextResponse) return gate

  const clientId = process.env.CLIENT_ID!

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!isManualPayload(body)) {
    return NextResponse.json({ error: 'Invalid reservation payload.' }, { status: 422 })
  }

  const services = await readBookingServices()
  const svc = services.find((s) => s.id === body.serviceId.trim())
  if (!svc) {
    return NextResponse.json({ error: 'Unknown service.' }, { status: 422 })
  }

  const durationMinutes = resolveServiceDuration(svc)
  if (!durationMinutes) {
    return NextResponse.json({ error: 'Service has no bookable duration.' }, { status: 422 })
  }

  const record: StoredReservation = {
    id: `${clientId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    clientId,
    serviceId: svc.id,
    durationMinutes,
    name: body.name.trim(),
    email: body.email.trim(),
    phone: body.phone.trim(),
    date: body.date,
    time: body.time.trim(),
    notes: typeof body.notes === 'string' ? body.notes.trim() || null : null,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  }

  try {
    await appendReservation(record)
  } catch (err) {
    console.error('[admin/reservations] append failed:', err)
    return NextResponse.json({ error: 'Failed to save reservation.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: record.id })
}
