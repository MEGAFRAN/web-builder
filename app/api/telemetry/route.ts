import { NextRequest, NextResponse } from 'next/server'
import type { ConversionEventType } from '@/lib/telemetry'
import { incrementTelemetryCounter } from '@/lib/telemetry-local-store'

type TelemetryPayload = {
  site_id: string
  event_type: ConversionEventType
  timestamp: string
}

const EVENT_TYPES = new Set<ConversionEventType>(['click_whatsapp', 'click_phone'])

function corsHeaders(origin: string | null): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin ?? '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'false',
    Vary: 'Origin',
  }
}

function isValidPayload(body: unknown): body is TelemetryPayload {
  if (typeof body !== 'object' || body === null) return false
  const b = body as Record<string, unknown>
  return (
    typeof b.site_id === 'string' &&
    b.site_id.trim().length > 0 &&
    typeof b.event_type === 'string' &&
    EVENT_TYPES.has(b.event_type as ConversionEventType) &&
    typeof b.timestamp === 'string' &&
    b.timestamp.trim().length > 0 &&
    !Number.isNaN(Date.parse(b.timestamp))
  )
}

async function parseBody(req: NextRequest): Promise<unknown> {
  const contentType = req.headers.get('content-type')?.toLowerCase() ?? ''
  if (contentType.includes('application/json')) {
    return req.json()
  }
  const text = await req.text()
  return JSON.parse(text)
}

function dateFromTimestamp(timestamp: string): string {
  return new Date(timestamp).toISOString().slice(0, 10)
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(req.headers.get('origin')),
  })
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin')

  let body: unknown
  try {
    body = await parseBody(req)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers: corsHeaders(origin) })
  }

  if (!isValidPayload(body)) {
    return NextResponse.json(
      { error: 'Missing or invalid fields: site_id, event_type, and timestamp are required.' },
      { status: 422, headers: corsHeaders(origin) },
    )
  }

  try {
    await incrementTelemetryCounter(
      body.site_id.trim(),
      body.event_type,
      dateFromTimestamp(body.timestamp),
    )
  } catch {
    return NextResponse.json(
      { error: 'Failed to persist telemetry.' },
      { status: 500, headers: corsHeaders(origin) },
    )
  }

  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) })
}
