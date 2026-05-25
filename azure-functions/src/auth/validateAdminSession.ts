import { createHmac, timingSafeEqual } from 'crypto'
import type { HttpRequest } from '@azure/functions'

export const ADMIN_SESSION_COOKIE = 'bp_admin_session'

type SessionPayload = {
  email: string
  clientId: string
  exp: number
}

export class HttpError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

function verifySessionToken(token: string, secret: string): SessionPayload | null {
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

function parseCookieHeader(header: string | null): Record<string, string> {
  if (!header) return {}
  return header.split(';').reduce<Record<string, string>>((acc, part) => {
    const eq = part.indexOf('=')
    if (eq === -1) return acc
    const key = part.slice(0, eq).trim()
    const value = part.slice(eq + 1).trim()
    if (key) acc[key] = decodeURIComponent(value)
    return acc
  }, {})
}

export function validateAdminSession(req: HttpRequest): SessionPayload {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret) {
    throw new HttpError(503, 'Admin auth is not configured.')
  }
  const cookies = parseCookieHeader(req.headers.get('cookie'))
  const raw = cookies[ADMIN_SESSION_COOKIE]
  if (!raw) {
    throw new HttpError(401, 'Unauthorized')
  }
  const payload = verifySessionToken(raw, secret)
  if (!payload) {
    throw new HttpError(401, 'Unauthorized')
  }
  return payload
}

export function validateBuildToken(req: HttpRequest): string | null {
  const token = process.env.COMPANY_PROFILE_BUILD_TOKEN?.trim()
  if (!token) return null
  const auth = req.headers.get('authorization')?.trim() ?? ''
  if (!auth.toLowerCase().startsWith('bearer ')) return null
  const provided = auth.slice(7).trim()
  if (provided !== token) return null
  const clientId = req.query.get('clientId')?.trim()
  return clientId || null
}
