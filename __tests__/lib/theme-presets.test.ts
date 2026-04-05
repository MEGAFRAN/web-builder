// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { THEME_PRESETS, getPreset } from '@/lib/theme-presets'
import type { ThemePreset } from '@/lib/theme-presets'

const REQUIRED_FIELDS: (keyof ThemePreset)[] = [
  'primaryColor',
  'accentColor',
  'backgroundColor',
  'fontHeading',
  'fontBody',
  'borderRadius',
]

describe('THEME_PRESETS', () => {
  it('contains at least 5 presets including "default"', () => {
    expect(Object.keys(THEME_PRESETS).length).toBeGreaterThanOrEqual(5)
    expect(THEME_PRESETS).toHaveProperty('default')
  })

  it.each(Object.keys(THEME_PRESETS))('preset "%s" has all 6 required fields', (name) => {
    const preset = THEME_PRESETS[name]
    for (const field of REQUIRED_FIELDS) {
      expect(preset).toHaveProperty(field)
      expect(preset[field]).toBeDefined()
    }
  })

  it.each(Object.keys(THEME_PRESETS))('preset "%s" has no extra keys', (name) => {
    const keys = Object.keys(THEME_PRESETS[name])
    expect(keys.sort()).toEqual([...REQUIRED_FIELDS].sort())
  })

  it('borderRadius is a number for every preset', () => {
    for (const preset of Object.values(THEME_PRESETS)) {
      expect(typeof preset.borderRadius).toBe('number')
    }
  })
})

describe('getPreset', () => {
  it('returns the correct preset for a known name', () => {
    const preset = getPreset('bold-restaurant')
    expect(preset).toEqual(THEME_PRESETS['bold-restaurant'])
  })

  it('returns the default preset', () => {
    const preset = getPreset('default')
    expect(preset).toEqual(THEME_PRESETS['default'])
  })

  it('returns undefined for an unknown name', () => {
    expect(getPreset('does-not-exist')).toBeUndefined()
  })

  it('returns undefined for an empty string', () => {
    expect(getPreset('')).toBeUndefined()
  })
})
