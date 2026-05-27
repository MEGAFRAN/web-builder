// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { StoredReservation } from '@/types/admin'

const paymentIntentsCreateMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/setup-intent', () => ({
  isStripeServerConfigured: () => true,
}))

vi.mock('stripe', () => ({
  default: class MockStripe {
    paymentIntents = { create: paymentIntentsCreateMock }
    constructor(key: string) {
      void key
    }
  },
}))

import { chargeNoShowStripe } from '@/lib/charge-noshow'

const reservation: StoredReservation = {
  id: 'res-1',
  clientId: 'client-x',
  serviceId: 'cut',
  name: 'Ada',
  email: 'ada@example.com',
  phone: '+1',
  date: '2026-05-06',
  time: '09:00',
  status: 'no-show',
  createdAt: '2026-01-01',
  guarantee: {
    paymentMethodId: 'pm_123',
    customerId: 'cus_123',
    status: 'vaulted',
  },
}

describe('chargeNoShowStripe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.STRIPE_SECRET_KEY = 'sk_test_mock'
    paymentIntentsCreateMock.mockResolvedValue({ id: 'pi_123' })
  })

  it('maps display currency symbols before calling Stripe', async () => {
    const result = await chargeNoShowStripe({
      reservation,
      amount: 50,
      currency: '€',
      stripeAccountId: 'acct_123',
    })

    expect(result).toEqual({ ok: true, status: 'cancelled_and_charged', amount: 50 })
    expect(paymentIntentsCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 5000,
        currency: 'eur',
        payment_method: 'pm_123',
        customer: 'cus_123',
        off_session: true,
        confirm: true,
      }),
      { stripeAccount: 'acct_123' },
    )
  })

  it('returns a clear error when customerId is missing', async () => {
    const result = await chargeNoShowStripe({
      reservation: {
        ...reservation,
        guarantee: { paymentMethodId: 'pm_123', status: 'vaulted' },
      },
      amount: 50,
      currency: 'eur',
      stripeAccountId: 'acct_123',
    })

    expect(result).toEqual({
      ok: false,
      status: 'cancelled_charge_failed',
      error:
        'This reservation is missing the Stripe customer ID. The guest must re-book with a card on file.',
    })
    expect(paymentIntentsCreateMock).not.toHaveBeenCalled()
  })

  it('surfaces Stripe decline messages', async () => {
    paymentIntentsCreateMock.mockRejectedValueOnce(new Error('Your card was declined.'))

    const result = await chargeNoShowStripe({
      reservation,
      amount: 50,
      currency: 'eur',
      stripeAccountId: 'acct_123',
    })

    expect(result).toEqual({
      ok: false,
      status: 'cancelled_charge_failed',
      error: 'Your card was declined.',
    })
  })
})
