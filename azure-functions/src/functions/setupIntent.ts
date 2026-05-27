import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { readStripeAccountId } from '../cosmos/stripeConnectStore'
import {
  handleHttpError,
  handleOptions,
  jsonResponse,
} from '../http/responseHelpers'
import { createConnectedSetupIntent } from '../lib/setupIntent'

async function handler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const origin = request.headers.get('origin')
  const methods = 'GET, OPTIONS'

  const options = handleOptions(request, methods)
  if (options) return options

  if (request.method !== 'GET') {
    return jsonResponse(405, origin, methods, { error: 'Method not allowed.' })
  }

  const clientId = request.query.get('clientId')?.trim()
  const email = request.query.get('email')?.trim()

  if (!clientId) {
    return jsonResponse(400, origin, methods, { error: 'clientId query param is required.' })
  }

  if (!email) {
    return jsonResponse(422, origin, methods, { error: 'email query param is required.' })
  }

  if (!process.env.STRIPE_SECRET_KEY?.trim()) {
    return jsonResponse(503, origin, methods, { error: 'Stripe is not configured on the server.' })
  }

  try {
    const stripeAccountId = await readStripeAccountId(clientId)
    if (!stripeAccountId) {
      return jsonResponse(503, origin, methods, {
        error: 'Stripe Connect is not configured for this business.',
      })
    }

    const payload = await createConnectedSetupIntent({
      clientId,
      email,
      stripeAccountId,
    })

    return jsonResponse(200, origin, methods, payload, { 'Cache-Control': 'no-store' })
  } catch (err) {
    return handleHttpError(err, origin, methods, 'setup-intent', context)
  }
}

app.http('setupIntent', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'setup-intent',
  handler,
})
