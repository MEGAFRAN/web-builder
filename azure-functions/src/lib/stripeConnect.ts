import Stripe from 'stripe'
import { resolveCountryIso } from './countryIso'

export type StripeConnectResult = {
  accountId: string | null
  status: 'not_connected' | 'existing' | 'created'
  chargesEnabled: boolean
  detailsSubmitted: boolean
  capabilities: Record<string, string> | null
  onboardingUrl?: string | null
}

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim()
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not configured.')
  }
  return new Stripe(key)
}

function capabilitiesRecord(
  capabilities: Stripe.Account.Capabilities | null | undefined,
): Record<string, string> | null {
  if (!capabilities) return null
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(capabilities)) {
    if (typeof value === 'string') out[key] = value
  }
  return Object.keys(out).length > 0 ? out : null
}

function statusFromAccount(
  accountId: string,
  account: Stripe.Account,
  status: 'existing' | 'created',
): StripeConnectResult {
  return {
    accountId,
    status,
    chargesEnabled: account.charges_enabled ?? false,
    detailsSubmitted: account.details_submitted ?? false,
    capabilities: capabilitiesRecord(account.capabilities),
    onboardingUrl: null,
  }
}

export async function connectStripeAccount(params: {
  clientId: string
  email: string
  country: string
  existingAccountId: string | null
  returnUrl: string
}): Promise<StripeConnectResult> {
  const stripe = getStripe()
  const country = resolveCountryIso(params.country)
  let accountId = params.existingAccountId

  if (accountId) {
    try {
      const existing = await stripe.accounts.retrieve(accountId)
      const base = statusFromAccount(accountId, existing, 'existing')
      if (!existing.details_submitted) {
        const link = await stripe.accountLinks.create({
          account: accountId,
          refresh_url: params.returnUrl,
          return_url: params.returnUrl,
          type: 'account_onboarding',
        })
        return { ...base, onboardingUrl: link.url }
      }
      return base
    } catch {
      accountId = null
    }
  }

  const account = await stripe.accounts.create({
    country,
    email: params.email,
    business_type: 'individual',
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    controller: {
      fees: { payer: 'account' },
      losses: { payments: 'stripe' },
      stripe_dashboard: { type: 'express' },
    },
    metadata: {
      onboarding_type: 'deferred',
      platform_user_id: params.clientId,
    },
  })

  const link = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: params.returnUrl,
    return_url: params.returnUrl,
    type: 'account_onboarding',
  })

  const base = statusFromAccount(account.id, account, 'created')
  return { ...base, onboardingUrl: link.url }
}

export async function getStripeConnectStatus(
  accountId: string | null,
): Promise<StripeConnectResult> {
  if (!accountId) {
    return {
      accountId: null,
      status: 'not_connected',
      chargesEnabled: false,
      detailsSubmitted: false,
      capabilities: null,
    }
  }

  const stripe = getStripe()
  try {
    const account = await stripe.accounts.retrieve(accountId)
    return statusFromAccount(accountId, account, 'existing')
  } catch {
    return {
      accountId: null,
      status: 'not_connected',
      chargesEnabled: false,
      detailsSubmitted: false,
      capabilities: null,
    }
  }
}
