import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { getContainer } from '../cosmosClient'

function corsHeaders(origin: string | null): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin ?? '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

/**
 * GET /api/availability?clientId=<id>&date=YYYY-MM-DD
 *
 * Returns the list of time slots already booked for the given client and date,
 * so the frontend can render them as unavailable.
 *
 * Response: { bookedSlots: string[] }  e.g. { bookedSlots: ["13:00", "14:30"] }
 */
async function handler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const origin = request.headers.get('origin')

  if (request.method === 'OPTIONS') {
    return { status: 204, headers: corsHeaders(origin) }
  }

  const clientId = request.query.get('clientId')
  const date = request.query.get('date')

  if (!clientId || !date) {
    return {
      status: 400,
      headers: corsHeaders(origin),
      jsonBody: { error: 'clientId and date query parameters are required.' },
    }
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return {
      status: 400,
      headers: corsHeaders(origin),
      jsonBody: { error: 'date must be in YYYY-MM-DD format.' },
    }
  }

  try {
    const container = getContainer()
    const { resources } = await container.items
      .query<{ time: string }>({
        query: 'SELECT c.time FROM c WHERE c.clientId = @clientId AND c.date = @date AND c.status != "cancelled"',
        parameters: [
          { name: '@clientId', value: clientId },
          { name: '@date', value: date },
        ],
      })
      .fetchAll()

    const bookedSlots = resources.map(r => r.time)
    context.log(`[availability] ${clientId} on ${date}: ${bookedSlots.length} booked slot(s)`)

    return {
      status: 200,
      headers: {
        ...corsHeaders(origin),
        'Cache-Control': 'no-store',
      },
      jsonBody: { bookedSlots },
    }
  } catch (err) {
    context.error('[availability] Cosmos DB query failed:', err)
    return {
      status: 500,
      headers: corsHeaders(origin),
      jsonBody: { error: 'Failed to fetch availability.' },
    }
  }
}

app.http('getAvailability', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'availability',
  handler,
})
