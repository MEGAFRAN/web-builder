import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { readStripeAccountId } from '../cosmos/stripeConnectStore'
import { createConnectedSetupIntent } from '../lib/setupIntent'

function corsHeaders(origin: string | null): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin ?? '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

async function handler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const origin = request.headers.get('origin')

  if (request.method === 'OPTIONS') {
    return { status: 204, headers: corsHeaders(origin) }
  }

  if (request.method !== 'GET') {
    return {
      status: 405,
      headers: corsHeaders(origin),
      jsonBody: { error: 'Method not allowed.' },
    }
  }

  const clientId = request.query.get('clientId')?.trim()
  const email = request.query.get('email')?.trim()

  if (!clientId) {
    return {
      status: 400,
      headers: corsHeaders(origin),
      jsonBody: { error: 'clientId query param is required.' },
    }
  }

  if (!email) {
    return {
      status: 422,
      headers: corsHeaders(origin),
      jsonBody: { error: 'email query param is required.' },
    }
  }

  if (!process.env.STRIPE_SECRET_KEY?.trim()) {
    return {
      status: 503,
      headers: corsHeaders(origin),
      jsonBody: { error: 'Stripe is not configured on the server.' },
    }
  }

  try {
    const stripeAccountId = await readStripeAccountId(clientId)
    if (!stripeAccountId) {
      return {
        status: 503,
        headers: corsHeaders(origin),
        jsonBody: { error: 'Stripe Connect is not configured for this business.' },
      }
    }

    const payload = await createConnectedSetupIntent({
      clientId,
      email,
      stripeAccountId,
    })

    return {
      status: 200,
      headers: { ...corsHeaders(origin), 'Cache-Control': 'no-store' },
      jsonBody: payload,
    }
  } catch (err) {
    context.error('[setup-intent] failed:', err)
    return {
      status: 500,
      headers: corsHeaders(origin),
      jsonBody: { error: 'Failed to create setup intent.' },
    }
  }
}

app.http('setupIntent', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'setup-intent',
  handler,
})
