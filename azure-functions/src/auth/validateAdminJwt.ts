import { jwtVerify } from 'jose'
import type { HttpRequest } from '@azure/functions'
import { HttpError } from '../errors/HttpError'
import { ADMIN_SESSION_COOKIE } from './constants'
import { getAdminJwtSecret } from './signAdminJwt'

export type AdminJwtPayload = {
  email: string
  clientId: string
  exp: number
}

const JWT_ALG = 'HS256'

function secretKey(secret: string): Uint8Array {
  return new TextEncoder().encode(secret)
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

export async function verifyAdminJwt(token: string): Promise<AdminJwtPayload> {
  try {
    const { payload } = await jwtVerify(token, secretKey(getAdminJwtSecret()), {
      algorithms: [JWT_ALG],
    })
    const email = payload.email
    const clientId = payload.clientId
    const exp = payload.exp
    if (typeof email !== 'string' || typeof clientId !== 'string' || typeof exp !== 'number') {
      throw new HttpError(401, 'Unauthorized')
    }
    return { email, clientId, exp }
  } catch (err) {
    if (err instanceof HttpError) throw err
    throw new HttpError(401, 'Unauthorized')
  }
}

export async function validateAdminJwt(req: HttpRequest): Promise<AdminJwtPayload> {
  const cookies = parseCookieHeader(req.headers.get('cookie'))
  const raw = cookies[ADMIN_SESSION_COOKIE]
  if (!raw) {
    throw new HttpError(401, 'Unauthorized')
  }
  return verifyAdminJwt(raw)
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
