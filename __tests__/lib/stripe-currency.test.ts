import { describe, expect, it } from 'vitest'
import { toStripeCurrency } from '@/lib/stripe-currency'

describe('toStripeCurrency', () => {
  it('maps display symbols to Stripe ISO codes', () => {
    expect(toStripeCurrency('€')).toBe('eur')
    expect(toStripeCurrency('$')).toBe('usd')
    expect(toStripeCurrency('£')).toBe('gbp')
  })

  it('normalizes ISO codes to lowercase', () => {
    expect(toStripeCurrency('EUR')).toBe('eur')
    expect(toStripeCurrency('usd')).toBe('usd')
  })

  it('defaults empty input to eur', () => {
    expect(toStripeCurrency('')).toBe('eur')
    expect(toStripeCurrency(undefined)).toBe('eur')
  })
})
