/** Maps display symbols and ISO codes to Stripe currency codes (lowercase ISO 4217). */
export function toStripeCurrency(input: string | null | undefined): string {
  const trimmed = (input ?? '').trim()
  if (!trimmed) return 'eur'

  switch (trimmed) {
    case '€':
    case 'EUR':
    case 'eur':
      return 'eur'
    case '$':
    case 'USD':
    case 'usd':
      return 'usd'
    case '£':
    case 'GBP':
    case 'gbp':
      return 'gbp'
    default:
      return trimmed.toLowerCase()
  }
}
