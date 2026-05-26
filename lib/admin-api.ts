/** Azure Functions base URL; empty string uses local Next.js Route Handlers in dev. */
const REMOTE_BASE = process.env.NEXT_PUBLIC_ADMIN_API_URL?.replace(/\/$/, '') ?? ''

// Cross-origin bearer token (SWA free tier blocks third-party cookies).
// Stored in sessionStorage — only populated when calling a remote API.
const BEARER_TOKEN_KEY = 'admin-bearer-token-v1'

export function setAdminToken(token: string): void {
  if (typeof window !== 'undefined') sessionStorage.setItem(BEARER_TOKEN_KEY, token)
}

export function clearAdminToken(): void {
  if (typeof window !== 'undefined') sessionStorage.removeItem(BEARER_TOKEN_KEY)
}

function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem(BEARER_TOKEN_KEY)
}

export function isRemoteAdminApi(): boolean {
  return REMOTE_BASE.length > 0
}

export function adminAuthUrl(action: 'login' | 'logout' | 'me'): string {
  if (REMOTE_BASE) {
    return `${REMOTE_BASE}/auth/${action}`
  }
  return `/api/admin/auth/${action}`
}

/** @param path Admin resource path starting with `/`, e.g. `/reservations` or `/schedule?id=x`. */
export function adminDataUrl(path: string): string {
  if (REMOTE_BASE) {
    return `${REMOTE_BASE}/admin${path}`
  }
  return `/api/admin${path}`
}

export function adminClientConfigUrl(clientId: string): string {
  if (REMOTE_BASE) {
    return `${REMOTE_BASE}/clients/${encodeURIComponent(clientId)}/config`
  }
  return '/api/admin/client-config'
}

let unauthorizedHandler: (() => void) | null = null

export function setAdminUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler
}

export async function adminFetch(url: string, init?: RequestInit): Promise<Response> {
  const token = getAdminToken()
  const merged: RequestInit = { ...init, credentials: 'include' }
  if (token) {
    const headers = new Headers(init?.headers)
    headers.set('Authorization', `Bearer ${token}`)
    merged.headers = headers
  }
  const res = await fetch(url, merged)
  if (res.status === 401 && unauthorizedHandler) {
    unauthorizedHandler()
  }
  return res
}

export type AdminClientConfigResponse = {
  displayName: string
  logoUrl: string | null
}

export type AdminLoginResponse = {
  ok?: boolean
  email?: string
  clientId?: string
  token?: string
  error?: string
}

export type AdminSessionInfo = {
  email: string
  clientId: string
}
