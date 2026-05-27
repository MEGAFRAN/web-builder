import { describe, expect, it } from 'vitest'
import { parseGuaranteePayload } from '@/lib/reservation-guarantee'

describe('parseGuaranteePayload', () => {
  it('parses payment method and customer', () => {
    expect(
      parseGuaranteePayload({
        paymentMethodId: 'pm_123',
        customerId: 'cus_456',
      }),
    ).toEqual({
      paymentMethodId: 'pm_123',
      customerId: 'cus_456',
      status: 'vaulted',
    })
  })

  it('returns null when payment method missing', () => {
    expect(parseGuaranteePayload({})).toBeNull()
  })
})
