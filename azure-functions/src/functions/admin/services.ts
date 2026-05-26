import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { validateAdminJwt } from '../../auth/validateAdminJwt'
import { getServices, upsertServices } from '../../cosmos/adminDb'
import {
  handleHttpError,
  handleOptions,
  jsonResponse,
} from '../../http/responseHelpers'
import { isServiceRow } from '../../validators/bookingCatalog'

async function handler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const origin = request.headers.get('origin')
  const methods = 'GET, PUT, OPTIONS'

  const options = handleOptions(request, methods)
  if (options) return options

  try {
    const session = await validateAdminJwt(request)

    if (request.method === 'GET') {
      const services = await getServices(session.clientId)
      return jsonResponse(200, origin, methods, { services }, { 'Cache-Control': 'no-store' })
    }

    if (request.method === 'PUT') {
      let body: unknown
      try {
        body = await request.json()
      } catch {
        return jsonResponse(400, origin, methods, { error: 'Invalid JSON' })
      }

      const b = body as { services?: unknown }
      if (!Array.isArray(b.services) || !b.services.every(isServiceRow)) {
        return jsonResponse(422, origin, methods, {
          error: 'Expected { services: AdminBookingService[] }.',
        })
      }

      await upsertServices(session.clientId, b.services)
      return jsonResponse(200, origin, methods, { ok: true })
    }

    return jsonResponse(405, origin, methods, { error: 'Method not allowed.' })
  } catch (err) {
    return handleHttpError(err, origin, methods, 'admin/services', context)
  }
}

app.http('adminServices', {
  methods: ['GET', 'PUT', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'admin/services',
  handler,
})
