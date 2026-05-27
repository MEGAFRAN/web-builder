import { describe, expect, it } from 'vitest'
import { resolveCountryIso } from '@/lib/country-iso'

describe('resolveCountryIso', () => {
  it('passes through 2-letter codes', () => {
    expect(resolveCountryIso('us')).toBe('US')
    expect(resolveCountryIso('ES')).toBe('ES')
  })

  it('maps common country names', () => {
    expect(resolveCountryIso('España')).toBe('ES')
    expect(resolveCountryIso('Colombia')).toBe('CO')
  })

  it('defaults unknown names to ES', () => {
    expect(resolveCountryIso('Atlantis')).toBe('ES')
  })
})
