import { NextRequest, NextResponse } from 'next/server'
import { getClientConfig } from '@/lib/client-config'

interface ContactPayload {
  name: string
  email: string
  message: string
}

function isValidPayload(body: unknown): body is ContactPayload {
  if (typeof body !== 'object' || body === null) return false
  const b = body as Record<string, unknown>
  return (
    typeof b.name === 'string' &&
    typeof b.email === 'string' &&
    typeof b.message === 'string' &&
    b.name.trim().length > 0 &&
    b.email.trim().length > 0 &&
    b.message.trim().length > 0
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
      { error: 'Missing or invalid fields: name, email, and message are required.' },
      { status: 422 }
    )
  }

  const clientId = process.env.CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'Server misconfiguration: CLIENT_ID not set.' }, { status: 500 })
  }

  let contactEndpoint: string | undefined
  try {
    const config = getClientConfig(clientId)
    contactEndpoint = config.contactEndpoint
  } catch {
    // Config read failure is non-fatal — fall through to local handler
  }

  if (contactEndpoint) {
    // Forward submission to the client-configured endpoint
    try {
      const upstream = await fetch(contactEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
        { error: 'Failed to reach the configured contact endpoint.' },
        { status: 502 }
      )
    }
  }

  // No external endpoint configured: log and acknowledge.
  // In production, swap this for your preferred delivery mechanism
  // (e.g. SendGrid, Resend, Azure Logic Apps).
  console.log('[contact] Submission received:', {
    name: body.name,
    email: body.email,
    messageLength: body.message.length,
  })

  return NextResponse.json({ ok: true })
}
