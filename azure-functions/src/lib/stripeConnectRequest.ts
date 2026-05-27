const ALLOWED_COUNTRY_CODES = new Set(['ES', 'CO'])

export function parseStripeConnectPostBody(body: unknown): { country: string } | null {
  if (typeof body !== 'object' || body === null) return null
  const country = (body as { country?: unknown }).country
  if (typeof country !== 'string') return null
  const code = country.trim().toUpperCase()
  if (!ALLOWED_COUNTRY_CODES.has(code)) return null
  return { country: code }
}
