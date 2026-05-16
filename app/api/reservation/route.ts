import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { getClientConfig } from '@/lib/client-config'

const LOCAL_DB_PATH = path.join(process.cwd(), 'data', 'reservations-local.json')

async function appendLocalReservation(record: Record<string, unknown>): Promise<void> {
  let records: unknown[] = []
  try {
    const raw = await fs.readFile(LOCAL_DB_PATH, 'utf-8')
    records = JSON.parse(raw)
  } catch { /* file doesn't exist yet — start fresh */ }
  records.push(record)
  await fs.writeFile(LOCAL_DB_PATH, JSON.stringify(records, null, 2))
}

interface ReservationPayload {
  name: string
  email: string
  phone: string
  date: string
  time: string
  partySize: number
  notes?: string
}

function isValidPayload(body: unknown): body is ReservationPayload {
  if (typeof body !== 'object' || body === null) return false
  const b = body as Record<string, unknown>
  return (
    typeof b.name === 'string' &&
    typeof b.email === 'string' &&
    typeof b.phone === 'string' &&
    typeof b.date === 'string' &&
    typeof b.time === 'string' &&
    typeof b.partySize === 'number' &&
    b.name.trim().length > 0 &&
    b.email.trim().length > 0 &&
    b.phone.trim().length > 0 &&
    b.date.trim().length > 0 &&
    b.time.trim().length > 0 &&
    b.partySize >= 1
  )
}

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!isValidPayload(body)) {
    return NextResponse.json(
      { error: 'Missing or invalid fields: name, email, phone, date, time, and partySize are required.' },
      { status: 422 }
    )
  }

  const clientId = process.env.CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'Server misconfiguration: CLIENT_ID not set.' }, { status: 500 })
  }

  let reservationEndpoint: string | undefined
  try {
    const config = getClientConfig(clientId)
    reservationEndpoint = config.reservationEndpoint
  } catch {
    // Config read failure is non-fatal — fall through to local handler
  }

  if (reservationEndpoint) {
    try {
      const upstream = await fetch(reservationEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, ...body }),
      })
      if (!upstream.ok) {
        return NextResponse.json(
          { error: 'Upstream endpoint returned an error.' },
          { status: 502 }
        )
      }
      return NextResponse.json({ ok: true })
    } catch {
      return NextResponse.json(
        { error: 'Failed to reach the configured reservation endpoint.' },
        { status: 502 }
      )
    }
  }

  // No external endpoint configured — persist to local JSON store.
  // In production, set reservationEndpoint in client.json to point to your Azure Function.
  const record = {
    id: `${clientId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    clientId,
    name: body.name.trim(),
    email: body.email.trim(),
    phone: body.phone.trim(),
    date: body.date,
    time: body.time,
    partySize: body.partySize,
    notes: body.notes?.trim() ?? null,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }

  try {
    await appendLocalReservation(record)
    console.log('[reservation] Saved locally:', record.id)
  } catch (err) {
    console.error('[reservation] Local write failed:', err)
    return NextResponse.json({ error: 'Failed to save reservation locally.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
