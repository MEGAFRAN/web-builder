/** Mock payment method injected in local dev when Stripe publishable key is unset. */
export const MOCK_PAYMENT_METHOD_ID = 'pm_mock_local_12345'

export const MOCK_STRIPE_CUSTOMER_ID = 'cus_mock_local_dev'

export function isMockBookingStripe(): boolean {
  return !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim()
}
