import { promises as fs } from 'fs'
import path from 'path'
import type { CompanyProfile } from '@/types/admin'

const CLIENT_DATA_DIR = path.join(process.cwd(), 'data', 'clients')

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

/**
 * Reads the company profile for the given client from
 * `data/clients/{clientId}/company-profile.json`.
 * Returns null when the file does not exist or contains invalid data.
 * Never falls back to any global file.
 */
export async function readCompanyProfile(clientId: string): Promise<CompanyProfile | null> {
  const filePath = path.join(CLIENT_DATA_DIR, clientId, 'company-profile.json')
  try {
    const raw = await fs.readFile(filePath, 'utf-8')
    const parsed = JSON.parse(raw) as unknown
    return parseCompanyProfile(parsed)
  } catch {
    return null
  }
}

/**
 * Persists the company profile for the given client to
 * `data/clients/{clientId}/company-profile.json`.
 */
export async function writeCompanyProfile(profile: CompanyProfile, clientId: string): Promise<void> {
  const filePath = path.join(CLIENT_DATA_DIR, clientId, 'company-profile.json')
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, JSON.stringify(profile, null, 2))
}
