import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { HttpError } from '../../errors/HttpError'
import { validateAdminJwt } from '../../auth/validateAdminJwt'
import {
  readStripeAccountId,
  writeStripeAccountId,
} from '../../cosmos/stripeConnectStore'
import { getClientProfileContainer } from '../../cosmos/clientProfileContainer'
import {
  connectStripeAccount,
  getStripeConnectStatus,
} from '../../lib/stripeConnect'
import { parseStripeConnectPostBody } from '../../lib/stripeConnectRequest'

type CompanyProfile = {
  email: string
}

type StoredProfileDocument = CompanyProfile & {
  id: string
  clientId: string
}

function corsHeaders(origin: string | null): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin ?? '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  }
}

async function readCompanyEmail(clientId: string): Promise<string> {
  const container = getClientProfileContainer()
  const id = `${clientId}-profile`
  try {
    const { resource } = await container.item(id, clientId).read<StoredProfileDocument>()
    if (!resource || resource.clientId !== clientId) {
      throw new HttpError(422, 'Complete your company profile (email) before connecting Stripe.')
    }
    const email = resource.email?.trim()
    if (!email) {
      throw new HttpError(422, 'Complete your company profile (email) before connecting Stripe.')
    }
    return email
  } catch (err) {
    if (err instanceof HttpError) throw err
    const code = (err as { code?: number }).code
    if (code === 404) {
      throw new HttpError(422, 'Complete your company profile (email) before connecting Stripe.')
    }
    throw err
  }
}

function resolveReturnUrl(request: HttpRequest): string {
  const configured = process.env.ADMIN_STRIPE_RETURN_URL?.trim()
  if (configured) return configured
  const origin = request.headers.get('origin')?.trim()
  if (origin) return `${origin.replace(/\/$/, '')}/admin/settings/`
  return 'http://localhost:3000/admin/settings/'
}

async function handler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const origin = request.headers.get('origin')

  if (request.method === 'OPTIONS') {
    return { status: 204, headers: corsHeaders(origin) }
  }

  try {
    const session = await validateAdminJwt(request)

    if (request.method === 'GET') {
      const accountId = await readStripeAccountId(session.clientId)
      const status = await getStripeConnectStatus(accountId)
      if (status.accountId === null && accountId) {
        await writeStripeAccountId(session.clientId, null)
      }
      return {
        status: 200,
        headers: { ...corsHeaders(origin), 'Cache-Control': 'no-store' },
        jsonBody: status,
      }
    }

    if (request.method === 'POST') {
      if (!process.env.STRIPE_SECRET_KEY?.trim()) {
        return {
          status: 503,
          headers: corsHeaders(origin),
          jsonBody: { error: 'Stripe is not configured on the server.' },
        }
      }

      let body: unknown
      try {
        body = await request.json()
      } catch {
        return {
          status: 400,
          headers: corsHeaders(origin),
          jsonBody: { error: 'Invalid JSON' },
        }
      }

      const parsed = parseStripeConnectPostBody(body)
      if (!parsed) {
        return {
          status: 422,
          headers: corsHeaders(origin),
          jsonBody: { error: 'A valid country (ES or CO) is required.' },
        }
      }

      const email = await readCompanyEmail(session.clientId)
      const existingAccountId = await readStripeAccountId(session.clientId)
      const result = await connectStripeAccount({
        clientId: session.clientId,
        email,
        country: parsed.country,
        existingAccountId,
        returnUrl: resolveReturnUrl(request),
      })

      if (result.accountId) {
        await writeStripeAccountId(session.clientId, result.accountId)
      } else if (existingAccountId) {
        await writeStripeAccountId(session.clientId, null)
      }

      return {
        status: 200,
        headers: corsHeaders(origin),
        jsonBody: result,
      }
    }

    return {
      status: 405,
      headers: corsHeaders(origin),
      jsonBody: { error: 'Method not allowed.' },
    }
  } catch (err) {
    if (err instanceof HttpError) {
      return {
        status: err.status,
        headers: corsHeaders(origin),
        jsonBody: { error: err.message },
      }
    }
    context.error('[mgmt/stripe-connect] request failed:', err)
    return {
      status: 500,
      headers: corsHeaders(origin),
      jsonBody: { error: 'Failed to process Stripe Connect request.' },
    }
  }
}

app.http('adminStripeConnect', {
  methods: ['GET', 'POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'mgmt/stripe-connect',
  handler,
})
