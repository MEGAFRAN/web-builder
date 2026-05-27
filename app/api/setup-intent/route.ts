import { NextRequest, NextResponse } from 'next/server'
import { getClientConfig } from '@/lib/client-config'
import { isGuaranteeRequired } from '@/lib/booking-guarantee'
import { readStripeAccountId } from '@/lib/stripe-connect-db'
import { createSetupIntentLocal, createSetupIntentStripe } from '@/lib/setup-intent'
import { isMockBookingStripe } from '@/lib/booking-stripe'

export async function GET(req: NextRequest) {
  const clientId = process.env.CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'CLIENT_ID not configured.' }, { status: 500 })
  }

  let config
  try {
    config = getClientConfig(clientId)
  } catch {
    return NextResponse.json({ error: 'Client config not found.' }, { status: 404 })
  }

  if (!isGuaranteeRequired(config.bookingSettings)) {
    return NextResponse.json({ error: 'Card guarantee is not enabled for this client.' }, { status: 404 })
  }

  if (isMockBookingStripe()) {
    return NextResponse.json(createSetupIntentLocal())
  }

  const stripeAccountId = await readStripeAccountId()
  if (!stripeAccountId) {
    return NextResponse.json(
      { error: 'Stripe Connect is not configured for this business.' },
      { status: 503 },
    )
  }

  const email = req.nextUrl.searchParams.get('email')?.trim()
  if (!email) {
    return NextResponse.json({ error: 'email query param is required.' }, { status: 422 })
  }

  try {
    const payload = await createSetupIntentStripe({
      clientId,
      email,
      stripeAccountId,
    })
    return NextResponse.json(payload)
  } catch (err) {
    console.error('[setup-intent] failed:', err)
    return NextResponse.json({ error: 'Failed to create setup intent.' }, { status: 500 })
  }
}
