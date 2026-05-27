import Stripe from 'stripe'
import type { BookingSettings } from '@/types/cms'
import type { AdminBookingService, StoredReservation } from '@/types/admin'
import { resolveNoShowCharge } from '@/lib/no-show-penalty'
import { toStripeCurrency } from '@/lib/stripe-currency'
import { readStripeAccountId } from '@/lib/stripe-connect-db'
import { isStripeServerConfigured } from '@/lib/setup-intent'

export type ChargeNoShowResult =
  | { ok: true; status: 'cancelled_and_charged'; amount: number }
  | { ok: false; status: 'cancelled_charge_failed'; error: string }

export async function chargeNoShowLocal(amount: number): Promise<ChargeNoShowResult> {
  return { ok: true, status: 'cancelled_and_charged', amount }
}

export async function chargeNoShowStripe(params: {
  reservation: StoredReservation
  amount: number
  currency: string
  stripeAccountId: string
}): Promise<ChargeNoShowResult> {
  const paymentMethodId = params.reservation.guarantee?.paymentMethodId
  const customerId = params.reservation.guarantee?.customerId

  if (!paymentMethodId) {
    return { ok: false, status: 'cancelled_charge_failed', error: 'No payment method on file.' }
  }

  if (!isStripeServerConfigured()) {
    return chargeNoShowLocal(params.amount)
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!.trim())

  try {
    if (!customerId?.trim()) {
      return {
        ok: false,
        status: 'cancelled_charge_failed',
        error:
          'This reservation is missing the Stripe customer ID. The guest must re-book with a card on file.',
      }
    }

    await stripe.paymentIntents.create(
      {
        amount: Math.round(params.amount * 100),
        currency: toStripeCurrency(params.currency),
        payment_method: paymentMethodId,
        customer: customerId.trim(),
        off_session: true,
        confirm: true,
        metadata: {
          reservationId: params.reservation.id,
          clientId: params.reservation.clientId,
        },
      },
      { stripeAccount: params.stripeAccountId },
    )
    return { ok: true, status: 'cancelled_and_charged', amount: params.amount }
  } catch (err) {
    const message =
      err && typeof err === 'object' && 'message' in err && typeof err.message === 'string'
        ? err.message
        : 'Charge failed.'
    return { ok: false, status: 'cancelled_charge_failed', error: message }
  }
}

export async function chargeNoShowForClient(params: {
  reservation: StoredReservation
  settings: BookingSettings
  services: AdminBookingService[]
}): Promise<ChargeNoShowResult> {
  const resolved = resolveNoShowCharge({
    reservation: params.reservation,
    services: params.services,
    settings: params.settings,
  })
  if ('error' in resolved) {
    return { ok: false, status: 'cancelled_charge_failed', error: resolved.error }
  }

  const stripeAccountId = await readStripeAccountId()
  if (!stripeAccountId) {
    return {
      ok: false,
      status: 'cancelled_charge_failed',
      error: 'Stripe Connect is not configured.',
    }
  }

  return chargeNoShowStripe({
    reservation: params.reservation,
    amount: resolved.amount,
    currency: resolved.currency,
    stripeAccountId,
  })
}
