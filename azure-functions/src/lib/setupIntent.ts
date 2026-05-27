import Stripe from 'stripe'

export type SetupIntentResult = {
  mock: boolean
  clientSecret: string | null
  customerId: string
  publishableKey: string | null
  stripeAccountId: string
}

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim()
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured.')
  return new Stripe(key)
}

export async function createConnectedSetupIntent(params: {
  clientId: string
  email: string
  stripeAccountId: string
}): Promise<SetupIntentResult> {
  const stripe = getStripe()
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

  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY?.trim() ?? null
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
