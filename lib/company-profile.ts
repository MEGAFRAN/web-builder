import { readCompanyProfile } from '@/lib/company-profile-db'
import type { CompanyProfile } from '@/types/admin'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isCompanyProfile(x: unknown): x is CompanyProfile {
  if (typeof x !== 'object' || x === null) return false
  const o = x as Record<string, unknown>
  const address = o.address
  if (typeof address !== 'object' || address === null) return false
  const addr = address as Record<string, unknown>

  const optionalStringOrNull = (value: unknown) =>
    value === null || value === undefined || typeof value === 'string'

  return (
    typeof o.businessName === 'string' &&
    o.businessName.trim().length > 0 &&
    typeof o.phone === 'string' &&
    o.phone.trim().length > 0 &&
    typeof o.email === 'string' &&
    EMAIL_RE.test(o.email.trim()) &&
    typeof addr.street === 'string' &&
    addr.street.trim().length > 0 &&
    typeof addr.city === 'string' &&
    addr.city.trim().length > 0 &&
    typeof addr.postalCode === 'string' &&
    addr.postalCode.trim().length > 0 &&
    typeof addr.country === 'string' &&
    addr.country.trim().length > 0 &&
    typeof o.hours === 'string' &&
    optionalStringOrNull(o.logoUrl) &&
    optionalStringOrNull(o.whatsapp)
  )
}

async function fetchRemoteCompanyProfile(clientId: string): Promise<CompanyProfile | null> {
  const remoteBase = process.env.NEXT_PUBLIC_ADMIN_API_URL?.replace(/\/$/, '') ?? ''
  if (!remoteBase) return null

  const token = process.env.COMPANY_PROFILE_BUILD_TOKEN?.trim()
  if (!token) return null

  try {
    const res = await fetch(
      `${remoteBase}/mgmt/company-profile?clientId=${encodeURIComponent(clientId)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      },
    )
    if (!res.ok) return null
    const data = (await res.json()) as { profile?: unknown }
    return isCompanyProfile(data.profile) ? data.profile : null
  } catch {
    return null
  }
}

export async function getCompanyProfile(clientId: string): Promise<CompanyProfile | null> {
  const remoteBase = process.env.NEXT_PUBLIC_ADMIN_API_URL?.replace(/\/$/, '') ?? ''
  if (remoteBase) {
    const remote = await fetchRemoteCompanyProfile(clientId)
    if (remote) return remote
  }

  const envClientId = process.env.CLIENT_ID
  if (envClientId && envClientId !== clientId) return null
  return readCompanyProfile()
}
