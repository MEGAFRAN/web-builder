import { promises as fs } from 'fs'
import path from 'path'
import type { CompanyProfile } from '@/types/admin'

const LOCAL_FILE = path.join(process.cwd(), 'data', 'company-profile-local.json')

type StoredCompanyProfile = CompanyProfile & { clientId?: string }

function isAddress(value: unknown): value is CompanyProfile['address'] {
  if (typeof value !== 'object' || value === null) return false
  const o = value as Record<string, unknown>
  return (
    typeof o.street === 'string' &&
    typeof o.city === 'string' &&
    typeof o.postalCode === 'string' &&
    typeof o.country === 'string'
  )
}

function parseCompanyProfile(raw: unknown): CompanyProfile | null {
  if (typeof raw !== 'object' || raw === null) return null
  const o = raw as Record<string, unknown>
  if (
    typeof o.businessName !== 'string' ||
    typeof o.phone !== 'string' ||
    typeof o.email !== 'string' ||
    typeof o.hours !== 'string' ||
    !isAddress(o.address)
  ) {
    return null
  }
  const logoUrl = o.logoUrl === null ? null : typeof o.logoUrl === 'string' ? o.logoUrl : null
  const whatsapp = o.whatsapp === null ? null : typeof o.whatsapp === 'string' ? o.whatsapp : null
  return {
    businessName: o.businessName,
    phone: o.phone,
    email: o.email,
    address: o.address,
    hours: o.hours,
    logoUrl,
    whatsapp,
  }
}

export async function readCompanyProfile(): Promise<CompanyProfile | null> {
  try {
    const raw = await fs.readFile(LOCAL_FILE, 'utf-8')
    const parsed = JSON.parse(raw) as unknown
    const profile = parseCompanyProfile(parsed)
    if (!profile) return null

    const storedClientId =
      typeof parsed === 'object' && parsed !== null && 'clientId' in parsed
        ? (parsed as StoredCompanyProfile).clientId
        : undefined
    const envClientId = process.env.CLIENT_ID
    if (storedClientId && envClientId && storedClientId !== envClientId) {
      return null
    }
    return profile
  } catch {
    return null
  }
}

export async function writeCompanyProfile(profile: CompanyProfile): Promise<void> {
  const clientId = process.env.CLIENT_ID
  const payload: StoredCompanyProfile = {
    ...(clientId ? { clientId } : {}),
    ...profile,
  }
  await fs.mkdir(path.dirname(LOCAL_FILE), { recursive: true })
  await fs.writeFile(LOCAL_FILE, JSON.stringify(payload, null, 2))
}
