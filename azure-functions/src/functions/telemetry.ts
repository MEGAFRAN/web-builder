import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { clientExists } from '../cosmos/adminUsersContainer'
import { incrementTelemetryCounter } from '../cosmos/telemetryStore'
import {
  dateFromTimestamp,
  isValidTelemetryPayload,
} from '../lib/telemetryPayload'

function corsHeaders(origin: string | null): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin ?? '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'false',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

async function parseBody(request: HttpRequest): Promise<unknown> {
  const text = await request.text()
  return JSON.parse(text)
}

export async function telemetryHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const origin = request.headers.get('origin')

  if (request.method === 'OPTIONS') {
    return { status: 204, headers: corsHeaders(origin) }
  }

  let body: unknown
  try {
    body = await parseBody(request)
  } catch {
    return {
      status: 400,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      jsonBody: { error: 'Invalid JSON' },
    }
  }

  if (!isValidTelemetryPayload(body)) {
    return {
      status: 422,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      jsonBody: { error: 'Missing or invalid fields.' },
    }
  }

  const siteId = body.site_id.trim()
  const allowed = await clientExists(siteId)
  if (!allowed) {
    context.log(`[telemetry] rejected unknown site_id count=1`)
    return {
      status: 403,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      jsonBody: { error: 'Forbidden' },
    }
  }

  const date = dateFromTimestamp(body.timestamp)
  try {
    await incrementTelemetryCounter(siteId, body.event_type, date)
    context.log(`[telemetry] increment ${siteId} ${body.event_type} ${date}`)
  } catch (err) {
    context.error('[telemetry] Cosmos write failed:', err)
    return {
      status: 500,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      jsonBody: { error: 'Failed to persist telemetry.' },
    }
  }

  return { status: 204, headers: corsHeaders(origin) }
}

app.http('telemetry', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'telemetry',
  handler: telemetryHandler,
})
