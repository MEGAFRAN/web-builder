// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { getClientConfig } from '@/lib/client-config'

describe('getClientConfig', () => {
  it('loads and returns the config for restaurante-pepe', () => {
    const config = getClientConfig('restaurante-pepe')
    expect(config.clientId).toBe('restaurante-pepe')
    expect(config.displayName).toBe('Restaurante Pepe')
    expect(config.theme.primaryColor).toBe('#c0392b')
    expect(config.features.menu).toBe(true)
    expect(config.features.blog).toBe(false)
  })

  it('loads and returns the config for peluqueria-ana', () => {
    const config = getClientConfig('peluqueria-ana')
    expect(config.clientId).toBe('peluqueria-ana')
    expect(config.features.booking).toBe(true)
  })

  it('throws when clientId does not exist', () => {
    expect(() => getClientConfig('nonexistent-client')).toThrow()
  })
})
