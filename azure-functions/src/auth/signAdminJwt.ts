import { SignJWT } from 'jose'
import { HttpError } from '../errors/HttpError'

const JWT_ALG = 'HS256'
const SESSION_TTL = '7d'

function secretKey(secret: string): Uint8Array {
  return new TextEncoder().encode(secret)
}

export function getAdminJwtSecret(): string {
  const secret = process.env.ADMIN_JWT_SECRET?.trim()
  if (!secret || secret.length < 32) {
    throw new HttpError(503, 'Admin auth is not configured.')
  }
  return secret
}

export async function signAdminJwt(email: string, clientId: string): Promise<string> {
  const secret = getAdminJwtSecret()
  return new SignJWT({ email, clientId })
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime(SESSION_TTL)
    .sign(secretKey(secret))
}
