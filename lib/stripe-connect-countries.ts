/** Supported Stripe Connect account countries (ISO 3166-1 alpha-2). */
export const STRIPE_CONNECT_COUNTRIES = [
  { code: 'ES', label: 'España' },
  { code: 'CO', label: 'Colombia' },
] as const

export type StripeConnectCountryCode = (typeof STRIPE_CONNECT_COUNTRIES)[number]['code']

export function isStripeConnectCountryCode(value: string): value is StripeConnectCountryCode {
  return STRIPE_CONNECT_COUNTRIES.some((entry) => entry.code === value)
}
