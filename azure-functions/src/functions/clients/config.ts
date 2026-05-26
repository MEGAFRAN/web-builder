import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { HttpError } from '../../errors/HttpError'
import { validateAdminJwt } from '../../auth/validateAdminJwt'
import { getAdminClientConfig } from '../../cosmos/adminDb'
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

  if (request.method !== 'GET') {
    return jsonResponse(405, origin, methods, { error: 'Method not allowed.' })
  }

  try {
    const routeClientId = request.params.clientId?.trim()
    if (!routeClientId) {
      return jsonResponse(400, origin, methods, { error: 'clientId is required.' })
    }

    const session = await validateAdminJwt(request)
    if (session.clientId !== routeClientId) {
      throw new HttpError(403, 'Forbidden')
    }

    const config = await getAdminClientConfig(routeClientId)
    if (!config) {
      throw new HttpError(404, 'Client config not found.')
    }

    return jsonResponse(200, origin, methods, config, { 'Cache-Control': 'no-store' })
  } catch (err) {
    return handleHttpError(err, origin, methods, 'clients/config', context)
  }
}

app.http('clientsConfig', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'clients/{clientId}/config',
  handler,
})
