import { NextRequest, NextResponse } from 'next/server'
import { readCompanyProfile } from '@/lib/company-profile-db'
import { requireAdminSession } from '@/lib/require-admin'
import { parseStripeConnectPostBody } from '@/lib/stripe-connect-request'
import {
  connectStripeAccountLocal,
  getStripeConnectStatusLocal,
} from '@/lib/stripe-connect'
import {
  readStripeAccountId,
  writeStripeAccountId,
} from '@/lib/stripe-connect-db'

export async function GET(req: NextRequest) {
  const gate = await requireAdminSession(req)
  if (gate instanceof NextResponse) return gate

  const accountId = await readStripeAccountId()
  return NextResponse.json(getStripeConnectStatusLocal(accountId))
}

export async function POST(req: NextRequest) {
  const gate = await requireAdminSession(req)
  if (gate instanceof NextResponse) return gate

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = parseStripeConnectPostBody(body)
  if (!parsed) {
    return NextResponse.json(
      { error: 'A valid country (ES or CO) is required.' },
      { status: 422 },
    )
  }

  const profile = await readCompanyProfile()
  const email = profile?.email?.trim()
  if (!email) {
    return NextResponse.json(
      { error: 'Complete your company profile (email) before connecting Stripe.' },
      { status: 422 },
    )
  }

  const result = connectStripeAccountLocal()
  if (result.accountId) {
    await writeStripeAccountId(result.accountId)
  }
  return NextResponse.json(result)
}
