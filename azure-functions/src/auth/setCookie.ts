import { ADMIN_SESSION_COOKIE, SESSION_TTL_SECONDS } from './constants'

/**
 * Admin SPA (SWA) and Functions run on different origins. Cross-site cookies need
 * SameSite=None + Secure. Azure App Service sets WEBSITE_SITE_NAME; NODE_ENV is
 * often unset on Function Apps, so we must not rely on NODE_ENV alone.
 */
export function isCrossSiteAdminCookieEnabled(): boolean {
  const override = process.env.ADMIN_COOKIE_CROSS_SITE?.trim().toLowerCase()
  if (override === '1' || override === 'true' || override === 'yes') return true
  if (override === '0' || override === 'false' || override === 'no') return false
  if (process.env.WEBSITE_SITE_NAME) return true
  return process.env.NODE_ENV === 'production'
}

function secureFlag(): string {
  return isCrossSiteAdminCookieEnabled() ? '; Secure' : ''
}

function sameSiteFlag(): string {
  return isCrossSiteAdminCookieEnabled() ? '; SameSite=None' : '; SameSite=Lax'
}

export function buildSetCookieHeader(token: string, clear = false): string {
  if (clear) {
    return `${ADMIN_SESSION_COOKIE}=; HttpOnly${sameSiteFlag()}${secureFlag()}; Path=/; Max-Age=0`
  }
  return `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly${sameSiteFlag()}${secureFlag()}; Path=/; Max-Age=${SESSION_TTL_SECONDS}`
}
