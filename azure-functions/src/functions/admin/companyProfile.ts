import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import {
  HttpError,
  validateAdminSession,
  validateBuildToken,
} from '../../auth/validateAdminSession'
import { getClientProfileContainer } from '../../cosmos/clientProfileContainer'

type CompanyProfile = {
  businessName: string
  phone: string
  email: string
  address: {
    street: string
    city: string
    postalCode: string
    country: string
  }
  hours: string
  logoUrl: string | null
  whatsapp: string | null
}

type StoredProfileDocument = CompanyProfile & {
  id: string
  clientId: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function corsHeaders(origin: string | null): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin ?? '*',
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  }
}

function isCompanyProfile(x: unknown): x is CompanyProfile {
  if (typeof x !== 'object' || x === null) return false
  const o = x as Record<string, unknown>
  const address = o.address
  if (typeof address !== 'object' || address === null) return false
  const addr = address as Record<string, unknown>
  const optionalStringOrNull = (value: unknown) =>
    value === null || value === undefined || typeof value === 'string'

  return (
    typeof o.businessName === 'string' &&
    o.businessName.trim().length > 0 &&
    typeof o.phone === 'string' &&
    o.phone.trim().length > 0 &&
    typeof o.email === 'string' &&
    EMAIL_RE.test(o.email.trim()) &&
    typeof addr.street === 'string' &&
    addr.street.trim().length > 0 &&
    typeof addr.city === 'string' &&
    addr.city.trim().length > 0 &&
    typeof addr.postalCode === 'string' &&
    addr.postalCode.trim().length > 0 &&
    typeof addr.country === 'string' &&
    addr.country.trim().length > 0 &&
    typeof o.hours === 'string' &&
    optionalStringOrNull(o.logoUrl) &&
    optionalStringOrNull(o.whatsapp)
  )
}

function normalizeProfile(raw: CompanyProfile): CompanyProfile {
  return {
    businessName: raw.businessName.trim(),
    phone: raw.phone.trim(),
    email: raw.email.trim(),
    address: {
      street: raw.address.street.trim(),
      city: raw.address.city.trim(),
      postalCode: raw.address.postalCode.trim(),
      country: raw.address.country.trim(),
    },
    hours: raw.hours.trim(),
    logoUrl: raw.logoUrl?.trim() ? raw.logoUrl.trim() : null,
    whatsapp: raw.whatsapp?.trim() ? raw.whatsapp.trim() : null,
  }
}

function documentToProfile(doc: StoredProfileDocument): CompanyProfile {
  return {
    businessName: doc.businessName,
    phone: doc.phone,
    email: doc.email,
    address: doc.address,
    hours: doc.hours,
    logoUrl: doc.logoUrl ?? null,
    whatsapp: doc.whatsapp ?? null,
  }
}

async function readProfile(clientId: string): Promise<CompanyProfile | null> {
  const container = getClientProfileContainer()
  const id = `${clientId}-profile`
  try {
    const { resource } = await container.item(id, clientId).read<StoredProfileDocument>()
    if (!resource || resource.clientId !== clientId) return null
    return documentToProfile(resource)
  } catch (err) {
    const code = (err as { code?: number }).code
    if (code === 404) return null
    throw err
  }
}

async function writeProfile(clientId: string, profile: CompanyProfile): Promise<void> {
  const container = getClientProfileContainer()
  const doc: StoredProfileDocument = {
    id: `${clientId}-profile`,
    clientId,
    ...profile,
  }
  await container.items.upsert(doc)
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
    if (request.method === 'GET') {
      const buildClientId = validateBuildToken(request)
      const clientId = buildClientId ?? validateAdminSession(request).clientId
      const profile = await readProfile(clientId)
      return {
        status: 200,
        headers: { ...corsHeaders(origin), 'Cache-Control': 'no-store' },
        jsonBody: { profile },
      }
    }

    if (request.method === 'PUT') {
      const session = validateAdminSession(request)
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

      const payload = (body as { profile?: unknown }).profile
      if (!isCompanyProfile(payload)) {
        return {
          status: 422,
          headers: corsHeaders(origin),
          jsonBody: { error: 'Invalid company profile payload.' },
        }
      }

      await writeProfile(session.clientId, normalizeProfile(payload))
      return {
        status: 200,
        headers: corsHeaders(origin),
        jsonBody: { ok: true },
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
    context.error('[admin/company-profile] request failed:', err)
    return {
      status: 500,
      headers: corsHeaders(origin),
      jsonBody: { error: 'Failed to process company profile request.' },
    }
  }
}

app.http('adminCompanyProfile', {
  methods: ['GET', 'PUT', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'admin/company-profile',
  handler,
})
