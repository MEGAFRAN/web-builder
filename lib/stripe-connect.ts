import type { StripeConnectResponse } from '@/types/admin'

const MOCK_ACCOUNT_ID = 'acct_mock_local_dev'

/** Local admin API mock when STRIPE_SECRET_KEY is unset (offline agent-friendly dev). */
export function connectStripeAccountLocal(): StripeConnectResponse {
  return {
    accountId: MOCK_ACCOUNT_ID,
    status: 'mock',
    chargesEnabled: true,
    detailsSubmitted: true,
    capabilities: { card_payments: 'active', transfers: 'active' },
    onboardingUrl: null,
  }
}

export function getStripeConnectStatusLocal(
  accountId: string | null,
): StripeConnectResponse {
  if (!accountId) {
    return {
      accountId: null,
      status: 'not_connected',
      chargesEnabled: false,
      detailsSubmitted: false,
      capabilities: null,
    }
  }
  return {
    accountId,
    status: 'mock',
    chargesEnabled: true,
    detailsSubmitted: true,
    capabilities: { card_payments: 'active', transfers: 'active' },
  }
}
