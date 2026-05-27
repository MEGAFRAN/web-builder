import Stripe from 'stripe'

export type ChargeNoShowResult =
  | { ok: true; status: 'cancelled_and_charged' }
  | { ok: false; status: 'cancelled_charge_failed'; error: string }

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim()
  if (!key) throw new Error('STRIPE_SECRET_KEY is not configured.')
  return new Stripe(key)
}

export async function chargeNoShowStripe(params: {
  paymentMethodId: string
  customerId?: string | null
  stripeAccountId: string
  amount: number
  currency: string
  reservationId: string
  clientId: string
}): Promise<ChargeNoShowResult> {
  const stripe = getStripe()
  try {
    await stripe.paymentIntents.create(
      {
        amount: Math.round(params.amount * 100),
        currency: params.currency.toLowerCase(),
        payment_method: params.paymentMethodId,
        ...(params.customerId ? { customer: params.customerId } : {}),
        off_session: true,
        confirm: true,
        metadata: {
          reservationId: params.reservationId,
          clientId: params.clientId,
        },
      },
      { stripeAccount: params.stripeAccountId },
    )
    return { ok: true, status: 'cancelled_and_charged' }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Charge failed.'
    return { ok: false, status: 'cancelled_charge_failed', error: message }
  }
}
