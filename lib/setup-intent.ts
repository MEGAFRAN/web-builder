import type { SetupIntentResponse } from '@/types/booking'
import { MOCK_STRIPE_CUSTOMER_ID } from '@/lib/booking-stripe'

export function createSetupIntentLocal(): SetupIntentResponse {
  return {
    mock: true,
    clientSecret: null,
    customerId: MOCK_STRIPE_CUSTOMER_ID,
    publishableKey: null,
    stripeAccountId: null,
  }
}

export function isStripeServerConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim())
}

export async function createSetupIntentStripe(params: {
  clientId: string
  email: string
  stripeAccountId: string
}): Promise<SetupIntentResponse> {
  if (!isStripeServerConfigured()) {
    return createSetupIntentLocal()
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const StripeSdk = require('stripe') as typeof import('stripe').default
  const stripe = new StripeSdk(process.env.STRIPE_SECRET_KEY!.trim())

  const customer = await stripe.customers.create(
    { email: params.email, metadata: { clientId: params.clientId } },
    { stripeAccount: params.stripeAccountId },
  )

  const setupIntent = await stripe.setupIntents.create(
    {
      customer: customer.id,
      payment_method_types: ['card'],
      usage: 'off_session',
      metadata: { clientId: params.clientId },
    },
    { stripeAccount: params.stripeAccountId },
  )

  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ?? null
  if (!publishableKey || !setupIntent.client_secret) {
    throw new Error('Stripe publishable key or client secret missing.')
  }

  return {
    mock: false,
    clientSecret: setupIntent.client_secret,
    customerId: customer.id,
    publishableKey,
    stripeAccountId: params.stripeAccountId,
  }
}
