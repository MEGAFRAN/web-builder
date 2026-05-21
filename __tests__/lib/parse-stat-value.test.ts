import { describe, it, expect } from 'vitest'
import { parseStatValue, formatStatValue } from '@/lib/parse-stat-value'

describe('parseStatValue', () => {
  it.each([
    ['+30', '+', 30, ''],
    ['100%', '', 100, '%'],
    ['+500', '+', 500, ''],
    ['4.9★', '', 4.9, '★'],
    ['1993', '', 1993, ''],
    ['3ª', '', 3, 'ª'],
  ] as const)(
    'parses %s',
    (input, prefix, numericValue, suffix) => {
      const parsed = parseStatValue(input)
      expect(parsed.prefix).toBe(prefix)
      expect(parsed.numericValue).toBe(numericValue)
      expect(parsed.suffix).toBe(suffix)
      expect(parsed.animatable).toBe(true)
    },
  )

  it('returns non-animatable values for text-only stats', () => {
    const parsed = parseStatValue('N/A')
    expect(parsed.animatable).toBe(false)
    expect(parsed.display).toBe('N/A')
  })
})

describe('formatStatValue', () => {
  it('preserves decimal precision for star ratings', () => {
    const parsed = parseStatValue('4.9★')
    expect(formatStatValue(parsed, 4.9)).toBe('4.9★')
  })
})
