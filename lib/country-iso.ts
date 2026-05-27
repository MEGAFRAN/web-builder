/** Maps common country names (and 2-letter codes) to ISO 3166-1 alpha-2 for Stripe Connect. */
const COUNTRY_TO_ISO: Record<string, string> = {
  es: 'ES',
  spain: 'ES',
  españa: 'ES',
  us: 'US',
  usa: 'US',
  'united states': 'US',
  gb: 'GB',
  uk: 'GB',
  'united kingdom': 'GB',
  co: 'CO',
  colombia: 'CO',
  fr: 'FR',
  france: 'FR',
  de: 'DE',
  germany: 'DE',
  it: 'IT',
  italy: 'IT',
  pt: 'PT',
  portugal: 'PT',
  mx: 'MX',
  mexico: 'MX',
  méxico: 'MX',
}

/** Resolves a free-text country field to a 2-letter ISO code; defaults to ES when unknown. */
export function resolveCountryIso(country: string): string {
  const trimmed = country.trim()
  if (/^[A-Za-z]{2}$/.test(trimmed)) {
    return trimmed.toUpperCase()
  }
  const key = trimmed.toLowerCase()
  return COUNTRY_TO_ISO[key] ?? 'ES'
}
