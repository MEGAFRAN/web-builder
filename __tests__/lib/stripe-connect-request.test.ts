import { describe, expect, it } from 'vitest'
import { parseStripeConnectPostBody } from '@/lib/stripe-connect-request'

describe('parseStripeConnectPostBody', () => {
  it('accepts ES and CO', () => {
    expect(parseStripeConnectPostBody({ country: 'ES' })).toEqual({ country: 'ES' })
    expect(parseStripeConnectPostBody({ country: 'co' })).toEqual({ country: 'CO' })
  })

  it('rejects invalid countries', () => {
    expect(parseStripeConnectPostBody({ country: 'US' })).toBeNull()
    expect(parseStripeConnectPostBody({})).toBeNull()
    expect(parseStripeConnectPostBody(null)).toBeNull()
  })
})
