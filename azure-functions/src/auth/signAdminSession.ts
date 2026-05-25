import { createHmac } from 'crypto'
import { ADMIN_SESSION_COOKIE } from './validateAdminSession'

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

type SessionPayload = {
  email: string
  clientId: string
  exp: number
}

export function signAdminSession(email: string, clientId: string): string {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret) {
    throw new Error('ADMIN_SESSION_SECRET is not configured.')
  }

  const payload: SessionPayload = {
    email,
    clientId,
    exp: Date.now() + SESSION_TTL_MS,
  }

  const payloadJson = JSON.stringify(payload)
  const payloadB64 = Buffer.from(payloadJson).toString('base64url')
  const sigHex = createHmac('sha256', secret).update(payloadJson).digest('hex')

  return `${payloadB64}.${sigHex}`
}

export function buildSetCookieHeader(token: string, clear = false): string {
  if (clear) {
    return `${ADMIN_SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Secure; Path=/; Max-Age=0`
  }
  const maxAge = Math.floor(SESSION_TTL_MS / 1000)
  return `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Secure; Path=/; Max-Age=${maxAge}`
}
