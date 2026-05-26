import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { validateAdminJwt } from '../../auth/validateAdminJwt'
import {
  handleHttpError,
  handleOptions,
  jsonResponse,
} from '../../http/responseHelpers'

export async function authMeHandler(
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
    const session = await validateAdminJwt(request)
    return jsonResponse(200, origin, methods, {
      email: session.email,
      clientId: session.clientId,
    }, { 'Cache-Control': 'no-store' })
  } catch (err) {
    return handleHttpError(err, origin, methods, 'auth/me', context)
  }
}

app.http('authMe', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'auth/me',
  handler: authMeHandler,
})
