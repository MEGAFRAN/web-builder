// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'

const paymentIntentsCreateMock = vi.hoisted(() => vi.fn())

vi.mock('stripe', () => ({
  default: class MockStripe {
    paymentIntents = { create: paymentIntentsCreateMock }
    constructor(key: string) {
      void key
    }
  },
  errors: { StripeError: class StripeError extends Error {} },
}))

import { chargeNoShowStripe } from '../../azure-functions/src/lib/chargeNoShow'

describe('azure chargeNoShowStripe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.STRIPE_SECRET_KEY = 'sk_test_mock'
    paymentIntentsCreateMock.mockResolvedValue({ id: 'pi_123' })
  })

  it('maps display currency symbols before calling Stripe', async () => {
    const result = await chargeNoShowStripe({
      paymentMethodId: 'pm_123',
      customerId: 'cus_123',
      stripeAccountId: 'acct_123',
      amount: 50,
      currency: '€',
      reservationId: 'res-1',
      clientId: 'client-x',
    })

    expect(result).toEqual({ ok: true, status: 'cancelled_and_charged' })
    expect(paymentIntentsCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({ currency: 'eur', amount: 5000 }),
      { stripeAccount: 'acct_123' },
    )
  })
})
