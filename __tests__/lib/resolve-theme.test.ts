// @vitest-environment node
// Unit tests for resolveTheme logic, exercised via getClientConfig with mocked fs.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { THEME_PRESETS } from '@/lib/theme-presets'

vi.mock('fs')

import fs from 'fs'

const mockFs = fs as unknown as {
  existsSync: ReturnType<typeof vi.fn>
  readFileSync: ReturnType<typeof vi.fn>
  readdirSync: ReturnType<typeof vi.fn>
}

function makeClientJson(theme: object): string {
  return JSON.stringify({
    clientId: 'test-client',
    displayName: 'Test Client',
    customDomain: 'test.com',
    swaResourceName: 'swa-test',
    features: { blog: false, booking: false, gallery: false, menu: false },
    theme,
  })
}

describe('resolveTheme (via getClientConfig)', () => {
  beforeEach(() => {
    vi.resetModules()
    // Directory-based client: client.json exists, no pages dir
    mockFs.existsSync = vi.fn((p: unknown) => String(p).endsWith('client.json'))
    mockFs.readdirSync = vi.fn(() => [])
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('preset only — returns fully-specified preset values', async () => {
    mockFs.readFileSync = vi.fn(() => makeClientJson({ preset: 'modern-minimal' }))
    const { getClientConfig } = await import('@/lib/client-config')
    const config = getClientConfig('test-client')
    expect(config.theme).toEqual(THEME_PRESETS['modern-minimal'])
    expect(config.theme).not.toHaveProperty('preset')
  })

  it('preset + override — override wins, rest from preset', async () => {
    mockFs.readFileSync = vi.fn(() =>
      makeClientJson({ preset: 'bold-restaurant', primaryColor: '#8B0000' })
    )
    const { getClientConfig } = await import('@/lib/client-config')
    const config = getClientConfig('test-client')
    expect(config.theme.primaryColor).toBe('#8B0000')
    expect(config.theme.accentColor).toBe(THEME_PRESETS['bold-restaurant'].accentColor)
    expect(config.theme.fontHeading).toBe(THEME_PRESETS['bold-restaurant'].fontHeading)
    expect(config.theme).not.toHaveProperty('preset')
  })

  it('all 10 explicit fields, no preset — returns those exact values', async () => {
    const explicit = {
      primaryColor: '#111111',
      accentColor: '#222222',
      backgroundColor: '#333333',
      textColor: '#444444',
      surfaceColor: '#555555',
      surfaceDark: '#666666',
      fontHeading: 'Georgia',
      fontBody: 'Arial',
      borderRadius: 0,
      pageInset: '1.5rem',
    }
    mockFs.readFileSync = vi.fn(() => makeClientJson(explicit))
    const { getClientConfig } = await import('@/lib/client-config')
    const config = getClientConfig('test-client')
    expect(config.theme).toEqual(explicit)
    expect(config.theme).not.toHaveProperty('preset')
  })

  it('no preset, partial fields — missing fields filled from default preset', async () => {
    mockFs.readFileSync = vi.fn(() => makeClientJson({ primaryColor: '#abcdef' }))
    const { getClientConfig } = await import('@/lib/client-config')
    const config = getClientConfig('test-client')
    expect(config.theme.primaryColor).toBe('#abcdef')
    expect(config.theme.accentColor).toBe(THEME_PRESETS['default'].accentColor)
    expect(config.theme.fontHeading).toBe(THEME_PRESETS['default'].fontHeading)
    expect(config.theme).not.toHaveProperty('preset')
  })

  it('unknown preset — warns and falls back to default', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mockFs.readFileSync = vi.fn(() => makeClientJson({ preset: 'nonexistent-preset' }))
    const { getClientConfig } = await import('@/lib/client-config')
    const config = getClientConfig('test-client')
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('nonexistent-preset'))
    expect(config.theme).toEqual(THEME_PRESETS['default'])
    expect(config.theme).not.toHaveProperty('preset')
  })

  it('no preset, no explicit fields — returns full default preset', async () => {
    mockFs.readFileSync = vi.fn(() => makeClientJson({}))
    const { getClientConfig } = await import('@/lib/client-config')
    const config = getClientConfig('test-client')
    expect(config.theme).toEqual(THEME_PRESETS['default'])
  })

  it('resolved theme always has exactly the 10 expected keys', async () => {
    mockFs.readFileSync = vi.fn(() => makeClientJson({ preset: 'vibrant-retail' }))
    const { getClientConfig } = await import('@/lib/client-config')
    const config = getClientConfig('test-client')
    const keys = Object.keys(config.theme).sort()
    expect(keys).toEqual(
      ['accentColor', 'backgroundColor', 'borderRadius', 'fontBody', 'fontHeading', 'pageInset', 'primaryColor', 'surfaceColor', 'surfaceDark', 'textColor']
    )
  })

  it('responsive pageInset object resolves to a clamp() string', async () => {
    mockFs.readFileSync = vi.fn(() =>
      makeClientJson({ preset: 'modern-minimal', pageInset: { mobile: '10px', desktop: '30px' } })
    )
    const { getClientConfig } = await import('@/lib/client-config')
    const config = getClientConfig('test-client')
    expect(typeof config.theme.pageInset).toBe('string')
    expect(config.theme.pageInset).toBe(
      'clamp(10px, calc(10px + (30 - 10) * ((100vw - 320px) / (1280 - 320))), 30px)'
    )
  })

  it('existing string pageInset passes through unchanged', async () => {
    mockFs.readFileSync = vi.fn(() =>
      makeClientJson({ preset: 'modern-minimal', pageInset: 'clamp(1rem, 5vw, 2rem)' })
    )
    const { getClientConfig } = await import('@/lib/client-config')
    const config = getClientConfig('test-client')
    expect(config.theme.pageInset).toBe('clamp(1rem, 5vw, 2rem)')
  })

  it('three-breakpoint responsive pageInset resolves using mobile+desktop only', async () => {
    mockFs.readFileSync = vi.fn(() =>
      makeClientJson({
        preset: 'modern-minimal',
        pageInset: { mobile: '10px', tablet: '20px', desktop: '30px' },
      })
    )
    const { getClientConfig } = await import('@/lib/client-config')
    const config = getClientConfig('test-client')
    expect(config.theme.pageInset).toBe(
      'clamp(10px, calc(10px + (30 - 10) * ((100vw - 320px) / (1280 - 320))), 30px)'
    )
  })
})
