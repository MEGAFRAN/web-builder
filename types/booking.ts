export type SetupIntentResponse = {
  mock: boolean
  clientSecret: string | null
  customerId: string
  publishableKey: string | null
  /** Connected account id for Stripe.js when using Stripe Connect. */
  stripeAccountId?: string | null
}
