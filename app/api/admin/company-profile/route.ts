import { NextRequest, NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/require-admin'
import { readCompanyProfile, writeCompanyProfile } from '@/lib/company-profile-db'
import { isCompanyProfile } from '@/lib/company-profile'
import type { CompanyProfile } from '@/types/admin'

function validationError(profile: unknown): string | null {
  if (typeof profile !== 'object' || profile === null) {
    return 'Expected a company profile object.'
  }
  const o = profile as Record<string, unknown>
  if (typeof o.businessName !== 'string' || o.businessName.trim().length === 0) {
    return 'businessName is required.'
  }
  if (typeof o.phone !== 'string' || o.phone.trim().length === 0) {
    return 'phone is required.'
  }
  if (typeof o.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(o.email.trim())) {
    return 'email must be a valid email address.'
  }
  const address = o.address
  if (typeof address !== 'object' || address === null) {
    return 'address is required.'
  }
  const addr = address as Record<string, unknown>
  if (typeof addr.street !== 'string' || addr.street.trim().length === 0) {
    return 'address.street is required.'
  }
  if (typeof addr.city !== 'string' || addr.city.trim().length === 0) {
    return 'address.city is required.'
  }
  if (typeof addr.postalCode !== 'string' || addr.postalCode.trim().length === 0) {
    return 'address.postalCode is required.'
  }
  if (typeof addr.country !== 'string' || addr.country.trim().length === 0) {
    return 'address.country is required.'
  }
  if (typeof o.hours !== 'string') {
    return 'hours must be a string.'
  }
  if (
    o.logoUrl !== null &&
    o.logoUrl !== undefined &&
    typeof o.logoUrl !== 'string'
  ) {
    return 'logoUrl must be a string or null.'
  }
  if (
    o.whatsapp !== null &&
    o.whatsapp !== undefined &&
    typeof o.whatsapp !== 'string'
  ) {
    return 'whatsapp must be a string or null.'
  }
  return null
}

function normalizeProfile(raw: CompanyProfile): CompanyProfile {
  return {
    businessName: raw.businessName.trim(),
    phone: raw.phone.trim(),
    email: raw.email.trim(),
    address: {
      street: raw.address.street.trim(),
      city: raw.address.city.trim(),
      postalCode: raw.address.postalCode.trim(),
      country: raw.address.country.trim(),
    },
    hours: raw.hours.trim(),
    logoUrl: raw.logoUrl?.trim() ? raw.logoUrl.trim() : null,
    whatsapp: raw.whatsapp?.trim() ? raw.whatsapp.trim() : null,
  }
}

export async function GET(req: NextRequest) {
  const gate = await requireAdminSession(req)
  if (gate instanceof NextResponse) return gate

  const profile = await readCompanyProfile(gate.clientId)
  return NextResponse.json({ profile })
}

export async function PUT(req: NextRequest) {
  const gate = await requireAdminSession(req)
  if (gate instanceof NextResponse) return gate

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const b = body as { profile?: unknown }
  const message = validationError(b.profile)
  if (message || !isCompanyProfile(b.profile)) {
    return NextResponse.json(
      { error: message ?? 'Invalid company profile payload.' },
      { status: 422 },
    )
  }

  try {
    await writeCompanyProfile(normalizeProfile(b.profile), gate.clientId)
  } catch (err) {
    console.error('[admin/company-profile] write failed:', err)
    return NextResponse.json({ error: 'Failed to save company profile.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
