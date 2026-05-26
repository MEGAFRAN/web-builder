import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { buildSetCookieHeader } from '../../auth/setCookie'
import { corsHeaders } from '../../http/responseHelpers'

async function handler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  void context
  const origin = request.headers.get('origin')

  if (request.method === 'OPTIONS') {
    return { status: 204, headers: corsHeaders(origin, 'POST, OPTIONS') }
  }

  if (request.method !== 'POST') {
    return {
      status: 405,
      headers: { ...corsHeaders(origin, 'POST, OPTIONS'), 'Content-Type': 'application/json' },
      jsonBody: { error: 'Method not allowed.' },
    }
  }

  return {
    status: 200,
    headers: {
      ...corsHeaders(origin, 'POST, OPTIONS'),
      'Content-Type': 'application/json',
      'Set-Cookie': buildSetCookieHeader('', true),
      'Cache-Control': 'no-store',
    },
    jsonBody: { ok: true },
  }
}

app.http('authLogout', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'auth/logout',
  handler,
})
