import { SignJWT, jwtVerify } from 'jose'
import { timingSafeEqual } from 'crypto'
import type { SessionPayload } from '@/types/admin'

export { ADMIN_SESSION_COOKIE } from '@/lib/admin-session-constants'

const JWT_ALG = 'HS256'
const SESSION_TTL = '7d'

function secretKey(secret: string): Uint8Array {
  return new TextEncoder().encode(secret)
}

export async function signSession(
  payload: Pick<SessionPayload, 'email' | 'clientId'>,
  secret: string,
): Promise<string> {
  return new SignJWT({ email: payload.email, clientId: payload.clientId })
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime(SESSION_TTL)
    .sign(secretKey(secret))
}

export async function verifySessionToken(
  token: string,
  secret: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(secret), {
      algorithms: [JWT_ALG],
    })
    const email = payload.email
    const clientId = payload.clientId
    const exp = payload.exp
    if (typeof email !== 'string' || typeof clientId !== 'string' || typeof exp !== 'number') {
      return null
    }
    return { email, clientId, exp }
  } catch {
    return null
  }
}

export function timingSafeEqualStr(a: string, b: string): boolean {
  const aa = Buffer.from(a, 'utf8')
  const bb = Buffer.from(b, 'utf8')
  if (aa.length !== bb.length) return false
  return timingSafeEqual(aa, bb)
}
