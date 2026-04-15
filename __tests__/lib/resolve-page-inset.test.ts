// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { resolvePageInset } from '@/lib/client-config'

describe('resolvePageInset', () => {
  describe('string passthrough', () => {
    it('returns a plain CSS value unchanged', () => {
      expect(resolvePageInset('1.5rem')).toBe('1.5rem')
    })

    it('returns a clamp() string unchanged', () => {
      expect(resolvePageInset('clamp(1rem, 5vw, 2rem)')).toBe('clamp(1rem, 5vw, 2rem)')
    })

    it('returns a px string unchanged', () => {
      expect(resolvePageInset('24px')).toBe('24px')
    })
  })

  describe('responsive object — two breakpoints (mobile + desktop)', () => {
    it('builds correct clamp() for px values', () => {
      const result = resolvePageInset({ mobile: '10px', desktop: '30px' })
      expect(result).toBe(
        'clamp(10px, calc(10px + (30 - 10) * ((100vw - 320px) / (1280 - 320))), 30px)'
      )
    })

    it('builds correct clamp() for rem values', () => {
      const result = resolvePageInset({ mobile: '1rem', desktop: '3rem' })
      expect(result).toBe(
        'clamp(1rem, calc(1rem + (3 - 1) * ((100vw - 320px) / (1280 - 320))), 3rem)'
      )
    })

    it('builds correct clamp() for mixed units (rem min, px max)', () => {
      const result = resolvePageInset({ mobile: '1rem', desktop: '48px' })
      expect(result).toBe(
        'clamp(1rem, calc(1rem + (48 - 1) * ((100vw - 320px) / (1280 - 320))), 48px)'
      )
    })
  })

  describe('responsive object — three breakpoints (mobile + tablet + desktop)', () => {
    it('builds clamp() using mobile and desktop only; tablet is accepted but not used in formula', () => {
      const result = resolvePageInset({ mobile: '10px', tablet: '20px', desktop: '30px' })
      expect(result).toBe(
        'clamp(10px, calc(10px + (30 - 10) * ((100vw - 320px) / (1280 - 320))), 30px)'
      )
    })

    it('three-breakpoint rem values — same clamp output as two-breakpoint', () => {
      const twoBreakpoint = resolvePageInset({ mobile: '1rem', desktop: '3rem' })
      const threeBreakpoint = resolvePageInset({ mobile: '1rem', tablet: '2rem', desktop: '3rem' })
      expect(threeBreakpoint).toBe(twoBreakpoint)
    })
  })

  describe('edge cases', () => {
    it('handles floating-point numeric part correctly', () => {
      const result = resolvePageInset({ mobile: '0.5rem', desktop: '2.5rem' })
      expect(result).toBe(
        'clamp(0.5rem, calc(0.5rem + (2.5 - 0.5) * ((100vw - 320px) / (1280 - 320))), 2.5rem)'
      )
    })

    it('handles zero mobile value', () => {
      const result = resolvePageInset({ mobile: '0px', desktop: '40px' })
      expect(result).toBe(
        'clamp(0px, calc(0px + (40 - 0) * ((100vw - 320px) / (1280 - 320))), 40px)'
      )
    })
  })
})
