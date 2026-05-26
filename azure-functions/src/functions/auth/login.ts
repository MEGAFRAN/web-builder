import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import * as bcrypt from 'bcryptjs'
import { findAdminUser, clientExists } from '../../cosmos/adminUsersContainer'
import { signAdminJwt } from '../../auth/signAdminJwt'
import { buildSetCookieHeader } from '../../auth/setCookie'
import { HttpError } from '../../errors/HttpError'

function corsHeaders(origin: string | null): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin ?? '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'true',
  }
}

export async function authLoginHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const origin = request.headers.get('origin')

  if (request.method === 'OPTIONS') {
    return { status: 204, headers: corsHeaders(origin) }
  }

  if (request.method !== 'POST') {
    return {
      status: 405,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      jsonBody: { error: 'Method not allowed.' },
    }
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return {
      status: 400,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      jsonBody: { error: 'Invalid JSON body.' },
    }
  }

  const { email, password, clientId } = (body ?? {}) as Record<string, unknown>

  if (!clientId || typeof clientId !== 'string' || clientId.trim() === '') {
    return {
      status: 503,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      jsonBody: { error: 'Admin login is not configured.' },
    }
  }

  try {
    const exists = await clientExists(clientId.trim())
    if (!exists) {
      return {
        status: 503,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        jsonBody: { error: 'Admin login is not configured.' },
      }
    }

    if (
      typeof email !== 'string' ||
      email.trim() === '' ||
      typeof password !== 'string' ||
      password === ''
    ) {
      return {
        status: 401,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        jsonBody: { error: 'Incorrect email or password' },
      }
    }

    const user = await findAdminUser(clientId.trim(), email.trim())

    // Always run bcrypt compare to prevent timing attacks even when user is not found
    const hashToCompare = user?.passwordHash ?? '$2b$10$invalidhashpadding000000000000000000000000000000000000'
    const passwordMatches = await bcrypt.compare(password, hashToCompare)

    if (!user || !passwordMatches) {
      return {
        status: 401,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        jsonBody: { error: 'Incorrect email or password' },
      }
    }

    const token = await signAdminJwt(user.email, user.clientId)
    const setCookie = buildSetCookieHeader(token)

    return {
      status: 200,
      headers: {
        ...corsHeaders(origin),
        'Content-Type': 'application/json',
        'Set-Cookie': setCookie,
        'Cache-Control': 'no-store',
      },
      // token is also returned in the body so cross-origin SPAs (e.g. SWA free
      // tier where third-party cookies are blocked) can store it in sessionStorage
      // and send it as Authorization: Bearer on subsequent requests.
      jsonBody: { ok: true, email: user.email, clientId: user.clientId, token },
    }
  } catch (err) {
    if (err instanceof HttpError) {
      return {
        status: err.status,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
        jsonBody: { error: err.message },
      }
    }
    context.error('[auth/login] request failed:', err)
    return {
      status: 500,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
      jsonBody: { error: 'Login failed. Please try again.' },
    }
  }
}

app.http('authLogin', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'auth/login',
  handler: authLoginHandler,
})
