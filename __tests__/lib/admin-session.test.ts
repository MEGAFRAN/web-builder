// @vitest-environment node
import { describe, expect, it, vi, afterEach } from 'vitest'
import {
  signSession,
  verifySessionToken,
  timingSafeEqualStr,
  ADMIN_SESSION_COOKIE,
} from '@/lib/admin-session'

afterEach(() => {
  vi.useRealTimers()
})

describe('admin-session', () => {
  it('re-exports ADMIN_SESSION_COOKIE', () => {
    expect(ADMIN_SESSION_COOKIE).toBe('admin-session')
  })

  describe('signSession / verifySessionToken', () => {
    const secret = 'test-secret-at-least-32-characters-long'

    it('round-trips a valid JWT payload', async () => {
      const token = await signSession({ email: 'a@b.com', clientId: 'client-1' }, secret)
      const payload = await verifySessionToken(token, secret)
      expect(payload).toMatchObject({ email: 'a@b.com', clientId: 'client-1' })
      expect(payload!.exp).toBeGreaterThan(Math.floor(Date.now() / 1000))
    })

    it('returns null when token is malformed', async () => {
      expect(await verifySessionToken('not-a-jwt', secret)).toBeNull()
    })

    it('returns null when session is expired', async () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-01-15T12:00:00Z'))
      const token = await signSession({ email: 'e@e.com', clientId: 'c' }, secret)
      vi.advanceTimersByTime(8 * 24 * 60 * 60 * 1000)
      expect(await verifySessionToken(token, secret)).toBeNull()
    })

    it('returns null when verified with wrong secret', async () => {
      const token = await signSession({ email: 'a@b.com', clientId: 'client-1' }, secret)
      expect(await verifySessionToken(token, 'other-secret-at-least-32-chars!!')).toBeNull()
    })
  })

  describe('timingSafeEqualStr', () => {
    it.each([
      ['same', 'same', true],
      ['a', 'ab', false],
      ['ab', 'a', false],
      ['hello', 'hallo', false],
    ] as const)('compares %j and %j → %s', (a, b, expected) => {
      expect(timingSafeEqualStr(a, b)).toBe(expected)
    })
  })
})
