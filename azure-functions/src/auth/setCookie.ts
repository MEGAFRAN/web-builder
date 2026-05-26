import { ADMIN_SESSION_COOKIE, SESSION_TTL_SECONDS } from './constants'

function secureFlag(): string {
  return process.env.NODE_ENV === 'production' ? '; Secure' : ''
}

export function buildSetCookieHeader(token: string, clear = false): string {
  if (clear) {
    return `${ADMIN_SESSION_COOKIE}=; HttpOnly; SameSite=Lax${secureFlag()}; Path=/; Max-Age=0`
  }
  return `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax${secureFlag()}; Path=/; Max-Age=${SESSION_TTL_SECONDS}`
}
