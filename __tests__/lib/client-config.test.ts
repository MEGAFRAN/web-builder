// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { getClientConfig } from '@/lib/client-config'

describe('getClientConfig (integration)', () => {
  it('loads restaurante-pepe and returns resolved theme with all 6 fields', () => {
    const config = getClientConfig('restaurante-pepe')
    expect(config.clientId).toBe('restaurante-pepe')
    expect(config.displayName).toBe('Restaurante Pepe')
    // Resolved from bold-restaurant preset
    expect(config.theme.primaryColor).toBe('#c0392b')
    expect(config.theme.accentColor).toBeDefined()
    expect(config.theme.backgroundColor).toBeDefined()
    expect(config.theme.fontHeading).toBeDefined()
    expect(config.theme.fontBody).toBeDefined()
    expect(typeof config.theme.borderRadius).toBe('number')
    // preset key must be stripped from resolved theme
    expect(config.theme).not.toHaveProperty('preset')
  })

  it('loads peluqueria-ana', () => {
    const config = getClientConfig('peluqueria-ana')
    expect(config.clientId).toBe('peluqueria-ana')
    expect(config.features.booking).toBe(true)
    expect(config.theme).not.toHaveProperty('preset')
  })

  it('throws when clientId does not exist', () => {
    expect(() => getClientConfig('nonexistent-client')).toThrow()
  })
})
