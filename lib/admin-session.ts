import { createHmac, timingSafeEqual } from 'crypto'
import type { SessionPayload } from '@/types/admin'

export { ADMIN_SESSION_COOKIE } from '@/lib/admin-session-constants'

/** Signed cookie value: base64url(JSON payload).hex_hmac */
export function signSession(payload: SessionPayload, secret: string): string {
  const payloadJson = JSON.stringify(payload)
  const sig = createHmac('sha256', secret).update(payloadJson).digest('hex')
  const b64 = Buffer.from(payloadJson, 'utf8').toString('base64url')
  return `${b64}.${sig}`
}

export function verifySessionToken(token: string, secret: string): SessionPayload | null {
  const dot = token.lastIndexOf('.')
  if (dot === -1) return null
  const payloadB64 = token.slice(0, dot)
  const sigHex = token.slice(dot + 1)
  if (!/^[0-9a-f]+$/i.test(sigHex) || sigHex.length % 2 !== 0) return null
  let payloadJson: string
  try {
    payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf8')
  } catch {
    return null
  }
  const expected = createHmac('sha256', secret).update(payloadJson).digest('hex')
  const a = Buffer.from(expected, 'hex')
  const b = Buffer.from(sigHex, 'hex')
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  let payload: SessionPayload
  try {
    payload = JSON.parse(payloadJson) as SessionPayload
  } catch {
    return null
  }
  if (
    typeof payload.email !== 'string' ||
    typeof payload.clientId !== 'string' ||
    typeof payload.exp !== 'number'
  ) {
    return null
  }
  if (payload.exp <= Date.now()) return null
  return payload
}

export function timingSafeEqualStr(a: string, b: string): boolean {
  const aa = Buffer.from(a, 'utf8')
  const bb = Buffer.from(b, 'utf8')
  if (aa.length !== bb.length) return false
  return timingSafeEqual(aa, bb)
}
