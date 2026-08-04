import { describe, expect, it } from 'vitest'
import { CLUBTAL_BRAND, WHATSAPP_PROFILE_SIZE, isClubtalBrand } from '@/lib/brand-mark'

describe('isClubtalBrand', () => {
  it('returns true for clubtal client id', () => {
    expect(isClubtalBrand('clubtal', null)).toBe(true)
  })

  it('returns true for clubtal-brand preset', () => {
    expect(isClubtalBrand('other', 'clubtal-brand')).toBe(true)
  })

  it('returns false for unrelated clients', () => {
    expect(isClubtalBrand('demo-phone-repair-shop', 'repair-shop-es')).toBe(false)
  })
})

describe('Clubtal WhatsApp profile constants', () => {
  it('uses native 640px profile size', () => {
    expect(WHATSAPP_PROFILE_SIZE).toBe(640)
  })

  it('includes the light border ring token for white-on-white WhatsApp chrome', () => {
    expect(CLUBTAL_BRAND.border).toBe('#e5e7eb')
  })
})
