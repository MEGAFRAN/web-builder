import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { HttpError } from '../../errors/HttpError'
import { validateAdminJwt } from '../../auth/validateAdminJwt'
import { getReservationById, getServices, updateReservationById } from '../../cosmos/adminDb'
import { readStripeAccountId } from '../../cosmos/stripeConnectStore'
import { resolveTenantBookingSettings } from '../../cosmos/tenantSettingsStore'
import { chargeNoShowStripe } from '../../lib/chargeNoShow'
import { resolveNoShowCharge } from '../../lib/noShowPenalty'

function corsHeaders(origin: string | null): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin ?? '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  }
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

    if (request.method !== 'POST') {
      return {
        status: 405,
        headers: corsHeaders(origin),
        jsonBody: { error: 'Method not allowed.' },
      }
    }

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

    const reservationId =
      typeof body === 'object' && body !== null && 'reservationId' in body
        ? String((body as { reservationId: unknown }).reservationId).trim()
        : ''
    if (!reservationId) {
      return {
        status: 422,
        headers: corsHeaders(origin),
        jsonBody: { error: 'reservationId is required.' },
      }
    }

    const settings = await resolveTenantBookingSettings(session.clientId)
    if (!settings?.enforceGuarantee) {
      return {
        status: 422,
        headers: corsHeaders(origin),
        jsonBody: { error: 'No-show guarantee is not enabled.' },
      }
    }

    const stripeAccountId = await readStripeAccountId(session.clientId)
    if (!stripeAccountId) {
      return {
        status: 503,
        headers: corsHeaders(origin),
        jsonBody: { error: 'Stripe Connect is not configured.' },
      }
    }

    const existing = await getReservationById(reservationId, session.clientId)
    if (!existing) {
      return {
        status: 404,
        headers: corsHeaders(origin),
        jsonBody: { error: 'Reservation not found.' },
      }
    }

    const paymentMethodId = existing.guarantee?.paymentMethodId
    if (!paymentMethodId) {
      return {
        status: 422,
        headers: corsHeaders(origin),
        jsonBody: { error: 'This reservation has no card on file.' },
      }
    }

    const services = await getServices(session.clientId)
    const resolved = resolveNoShowCharge({
      reservation: existing,
      services,
      settings,
    })
    if ('error' in resolved) {
      return {
        status: 422,
        headers: corsHeaders(origin),
        jsonBody: { error: resolved.error },
      }
    }

    const charge = await chargeNoShowStripe({
      paymentMethodId,
      customerId: existing.guarantee?.customerId,
      stripeAccountId,
      amount: resolved.amount,
      currency: resolved.currency,
      reservationId,
      clientId: session.clientId,
    })

    const updated = await updateReservationById(reservationId, session.clientId, (row) => ({
      ...row,
      status: charge.status,
      ...(charge.ok ? {} : { cancelReason: charge.error }),
    }))

    if (!charge.ok) {
      return {
        status: 402,
        headers: corsHeaders(origin),
        jsonBody: { error: charge.error, reservation: updated },
      }
    }

    return {
      status: 200,
      headers: corsHeaders(origin),
      jsonBody: { ok: true, reservation: updated },
    }
  } catch (err) {
    if (err instanceof HttpError) {
      return {
        status: err.status,
        headers: corsHeaders(origin),
        jsonBody: { error: err.message },
      }
    }
    context.error('[mgmt/charge-noshow] failed:', err)
    return {
      status: 500,
      headers: corsHeaders(origin),
      jsonBody: { error: 'Failed to charge no-show fee.' },
    }
  }
}

app.http('adminChargeNoShow', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'mgmt/charge-noshow',
  handler,
})
