// @vitest-environment node
import { createHmac } from 'crypto'
import { describe, expect, it, vi, afterEach } from 'vitest'
import {
  signSession,
  verifySessionToken,
  timingSafeEqualStr,
  ADMIN_SESSION_COOKIE,
} from '@/lib/admin-session'
import type { SessionPayload } from '@/types/admin'

afterEach(() => {
  vi.useRealTimers()
})

describe('admin-session', () => {
  it('re-exports ADMIN_SESSION_COOKIE', () => {
    expect(ADMIN_SESSION_COOKIE).toBe('bp_admin_session')
  })

  describe('signSession / verifySessionToken', () => {
    const secret = 'test-secret-key'
    const futurePayload = (): SessionPayload => ({
      email: 'a@b.com',
      clientId: 'client-1',
      exp: Date.now() + 60_000,
    })

    it('round-trips a valid payload', () => {
      const payload = futurePayload()
      const token = signSession(payload, secret)
      expect(verifySessionToken(token, secret)).toEqual(payload)
    })

    it.each([
      ['no-dot', 'missing separator'],
      ['aaaa', 'payload without dot'],
    ])('returns null when token is malformed: %s (%s)', (token) => {
      expect(verifySessionToken(token, secret)).toBeNull()
    })

    it('returns null when base64url decode fails', () => {
      const spy = vi.spyOn(Buffer, 'from').mockImplementationOnce(() => {
        throw new Error('bad decode')
      })
      expect(verifySessionToken('payload.abcd', secret)).toBeNull()
      spy.mockRestore()
    })

    it('returns null when signature is not hex', () => {
      const payload = futurePayload()
      const token = signSession(payload, secret)
      const [b64] = token.split('.')
      expect(verifySessionToken(`${b64}.GGGGGG`, secret)).toBeNull()
    })

    it('returns null when hex signature length is odd', () => {
      const payload = futurePayload()
      const token = signSession(payload, secret)
      const [b64] = token.split('.')
      expect(verifySessionToken(`${b64}.abc`, secret)).toBeNull()
    })

    it('returns null when HMAC does not match', () => {
      const payload = futurePayload()
      const token = signSession(payload, secret)
      const [b64, sig] = token.split('.')
      const flipped = sig.startsWith('0') ? `f${sig.slice(1)}` : `0${sig.slice(1)}`
      expect(verifySessionToken(`${b64}.${flipped}`, secret)).toBeNull()
    })

    it('returns null when JSON payload is invalid', () => {
      const payloadJson = '{not-json'
      const sig = createHmac('sha256', secret).update(payloadJson).digest('hex')
      const b64 = Buffer.from(payloadJson, 'utf8').toString('base64url')
      expect(verifySessionToken(`${b64}.${sig}`, secret)).toBeNull()
    })

    it.each([
      [{ email: 1, clientId: 'c', exp: Date.now() + 1 }, 'email'],
      [{ email: 'e', clientId: 1, exp: Date.now() + 1 }, 'clientId'],
      [{ email: 'e', clientId: 'c', exp: 'x' }, 'exp'],
    ] as const)('returns null when payload shape is wrong', (bad, _field) => {
      const payloadJson = JSON.stringify(bad)
      const sig = createHmac('sha256', secret).update(payloadJson).digest('hex')
      const b64 = Buffer.from(payloadJson, 'utf8').toString('base64url')
      expect(verifySessionToken(`${b64}.${sig}`, secret)).toBeNull()
    })

    it('returns null when session is expired', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-01-15T12:00:00Z'))
      const payload: SessionPayload = {
        email: 'e@e.com',
        clientId: 'c',
        exp: Date.now() - 1,
      }
      const token = signSession(payload, secret)
      expect(verifySessionToken(token, secret)).toBeNull()
    })

    it('returns null when verified with wrong secret', () => {
      const token = signSession(futurePayload(), secret)
      expect(verifySessionToken(token, 'other-secret')).toBeNull()
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
