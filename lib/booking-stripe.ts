import { isRemoteBookingApi } from '@/lib/booking-api'

/** Mock payment method injected in local dev when Stripe publishable key is unset. */
export const MOCK_PAYMENT_METHOD_ID = 'pm_mock_local_12345'

export const MOCK_STRIPE_CUSTOMER_ID = 'cus_mock_local_dev'

/** Local admin API mock when Stripe publishable key is unset (offline agent-friendly dev). */
export function isMockBookingStripe(): boolean {
  if (isRemoteBookingApi()) return false
  return !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim()
}
