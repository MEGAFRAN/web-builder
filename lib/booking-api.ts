import { resolveBuildClientId } from '@/lib/client-id'

/** Azure Functions base URL for public booking APIs; empty uses local Next.js Route Handlers in dev. */
const REMOTE_BASE = process.env.NEXT_PUBLIC_BOOKING_API_URL?.replace(/\/$/, '') ?? ''

/** Optional full URL override baked at build time from client.json → bookingServicesEndpoint. */
const BAKED_SERVICES_ENDPOINT =
  process.env.NEXT_PUBLIC_BOOKING_SERVICES_ENDPOINT?.replace(/\/$/, '') ?? ''

function appendClientIdQuery(baseUrl: string, clientId: string | null): string {
  if (!clientId) return baseUrl
  const separator = baseUrl.includes('?') ? '&' : '?'
  return `${baseUrl}${separator}clientId=${encodeURIComponent(clientId)}`
}

/**
 * Resolve the services catalog URL for ServicesBlock / ReservationBlock.
 * Precedence: block override → client.json baked endpoint → remote base → local Route Handler.
 */
export function bookingServicesUrl(
  clientId?: string | null,
  override?: string | null,
): string {
  const resolvedClientId = resolveBuildClientId(clientId)
  const explicit = override?.trim() || BAKED_SERVICES_ENDPOINT
  if (explicit) {
    return appendClientIdQuery(explicit, resolvedClientId)
  }
  if (REMOTE_BASE) {
    return appendClientIdQuery(`${REMOTE_BASE}/booking-services`, resolvedClientId)
  }
  return appendClientIdQuery('/api/booking-services', resolvedClientId)
}

export function isRemoteBookingApi(): boolean {
  return REMOTE_BASE.length > 0 || BAKED_SERVICES_ENDPOINT.length > 0
}
