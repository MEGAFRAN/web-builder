import { NextRequest, NextResponse } from 'next/server'
import { getClientConfig } from '@/lib/client-config'

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

  // No external endpoint configured: log and acknowledge.
  // In production, configure reservationEndpoint in client.json to point to your Azure Function.
  console.log('[reservation] Submission received:', {
    clientId,
    name: body.name,
    email: body.email,
    date: body.date,
    time: body.time,
    partySize: body.partySize,
  })

  return NextResponse.json({ ok: true })
}
