import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { readTenantBookingSettings } from '../cosmos/tenantSettingsStore'
import {
  handleHttpError,
  handleOptions,
  jsonResponse,
} from '../http/responseHelpers'

/**
 * GET /api/booking-settings?clientId=<id>
 *
 * Public read-only no-show policy for the booking widget (ReservationBlock).
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
    const bookingSettings = await readTenantBookingSettings(clientId)
    context.log(
      `[booking-settings] ${clientId}: enforceGuarantee=${bookingSettings?.enforceGuarantee ?? false}`,
    )
    return jsonResponse(
      200,
      origin,
      methods,
      { bookingSettings },
      { 'Cache-Control': 'public, max-age=60' },
    )
  } catch (err) {
    return handleHttpError(err, origin, methods, 'booking-settings', context)
  }
}

app.http('getBookingSettings', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'booking-settings',
  handler,
})
