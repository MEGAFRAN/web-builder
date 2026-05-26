import { readCompanyProfile } from '@/lib/company-profile-db'
import type { CompanyProfile } from '@/types/admin'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const profileCache = new Map<string, CompanyProfile | null>()

/** Test helper — module cache persists across imports within one build/test run. */
export function clearCompanyProfileCache(): void {
  profileCache.clear()
}

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

function companyProfileRemoteBase(): string {
  return (
    process.env.NEXT_PUBLIC_ADMIN_API_URL?.replace(/\/$/, '') ||
    process.env.NEXT_PUBLIC_BOOKING_API_URL?.replace(/\/$/, '') ||
    ''
  )
}

function companyProfileBuildToken(): string {
  return process.env.COMPANY_PROFILE_BUILD_TOKEN?.trim() ?? ''
}

export function isRemoteCompanyProfileConfigured(): boolean {
  return companyProfileRemoteBase().length > 0 && companyProfileBuildToken().length > 0
}

async function fetchRemoteCompanyProfile(clientId: string): Promise<CompanyProfile | null> {
  const remoteBase = companyProfileRemoteBase()
  const token = companyProfileBuildToken()
  if (!remoteBase || !token) return null

  const url = `${remoteBase}/mgmt/company-profile?clientId=${encodeURIComponent(clientId)}`
  console.log(`[build] company-profile fetch → ${url}`)

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'force-cache',
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.warn(
        `[build] company-profile fetch failed: HTTP ${res.status} from ${url}` +
        (body ? ` — ${body.slice(0, 200)}` : ''),
      )
      return null
    }
    const data = (await res.json()) as { profile?: unknown }
    const profile = isCompanyProfile(data.profile) ? data.profile : null
    if (profile) {
      console.log(`[build] company-profile: loaded "${profile.businessName}" for "${clientId}"`)
    } else {
      console.warn(
        `[build] company-profile: response did not contain a valid profile for "${clientId}"`,
        JSON.stringify(data).slice(0, 300),
      )
    }
    return profile
  } catch (err) {
    console.warn(`[build] company-profile fetch threw for ${url}:`, err)
    return null
  }
}

/**
 * Load company profile at SSG build time (cached per client; used by layout footer, blocks, JSON-LD).
 * Production deploys fetch from Azure Functions once per build when remote API + build token are set.
 */
export async function getCompanyProfile(clientId: string): Promise<CompanyProfile | null> {
  if (profileCache.has(clientId)) {
    return profileCache.get(clientId) ?? null
  }

  if (!isRemoteCompanyProfileConfigured()) {
    console.log(
      `[build] company-profile: remote not configured for "${clientId}"` +
      ` (NEXT_PUBLIC_BOOKING_API_URL=${process.env.NEXT_PUBLIC_BOOKING_API_URL ?? 'unset'},` +
      ` COMPANY_PROFILE_BUILD_TOKEN=${process.env.COMPANY_PROFILE_BUILD_TOKEN ? 'set' : 'unset'})`,
    )
  }

  if (isRemoteCompanyProfileConfigured()) {
    const remote = await fetchRemoteCompanyProfile(clientId)
    if (remote) {
      profileCache.set(clientId, remote)
      return remote
    }
    console.warn(`[build] company-profile: remote fetch failed, falling back to local for "${clientId}"`)
  }

  const envClientId = process.env.CLIENT_ID
  if (envClientId && envClientId !== clientId) {
    profileCache.set(clientId, null)
    return null
  }

  const local = await readCompanyProfile()
  profileCache.set(clientId, local)
  return local
}
