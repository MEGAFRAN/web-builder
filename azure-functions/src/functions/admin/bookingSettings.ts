import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { validateAdminJwt } from '../../auth/validateAdminJwt'
import { resolveTenantBookingSettings } from '../../cosmos/tenantSettingsStore'
import {
  handleHttpError,
  handleOptions,
  jsonResponse,
} from '../../http/responseHelpers'

async function handler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const origin = request.headers.get('origin')
  const methods = 'GET, OPTIONS'

  const options = handleOptions(request, methods)
  if (options) return options

  try {
    const session = await validateAdminJwt(request)
    const bookingSettings = await resolveTenantBookingSettings(session.clientId)
    return jsonResponse(200, origin, methods, { bookingSettings })
  } catch (err) {
    return handleHttpError(err, origin, methods, 'mgmt/booking-settings', context)
  }
}

app.http('adminBookingSettings', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'mgmt/booking-settings',
  handler,
})
