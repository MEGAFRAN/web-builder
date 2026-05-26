import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { getServices } from '../cosmos/adminDb'
import {
  handleHttpError,
  handleOptions,
  jsonResponse,
} from '../http/responseHelpers'

/**
 * GET /api/booking-services?clientId=<id>
 *
 * Public read-only service catalog for client sites (ServicesBlock, ReservationBlock).
 */
async function handler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const origin = request.headers.get('origin')
  const methods = 'GET, OPTIONS'

  const options = handleOptions(request, methods)
  if (options) return options

  const clientId = request.query.get('clientId')?.trim()
  if (!clientId) {
    return jsonResponse(400, origin, methods, {
      error: 'clientId query parameter is required.',
    })
  }

  try {
    const services = await getServices(clientId)
    context.log(`[booking-services] ${clientId}: ${services.length} service(s)`)
    return jsonResponse(
      200,
      origin,
      methods,
      { services },
      { 'Cache-Control': 'public, max-age=60' },
    )
  } catch (err) {
    return handleHttpError(err, origin, methods, 'booking-services', context)
  }
}

app.http('getBookingServices', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'booking-services',
  handler,
})
