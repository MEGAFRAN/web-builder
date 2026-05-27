import { resolveBuildClientId } from '@/lib/client-id'

function remoteBase(): string {
  return process.env.NEXT_PUBLIC_BOOKING_API_URL?.replace(/\/$/, '') ?? ''
}

function bakedServicesEndpoint(): string {
  return process.env.NEXT_PUBLIC_BOOKING_SERVICES_ENDPOINT?.replace(/\/$/, '') ?? ''
}

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
  const explicit = override?.trim() || bakedServicesEndpoint()
  if (explicit) {
    return appendClientIdQuery(explicit, resolvedClientId)
  }
  const base = remoteBase()
  if (base) {
    return appendClientIdQuery(`${base}/booking-services`, resolvedClientId)
  }
  return appendClientIdQuery('/api/booking-services', resolvedClientId)
}

export function isRemoteBookingApi(): boolean {
  return remoteBase().length > 0 || bakedServicesEndpoint().length > 0
}

/** Availability slots endpoint for the booking widget. */
export function availabilityUrl(
  clientId?: string | null,
  override?: string | null,
): string {
  const explicit = override?.trim()
  if (explicit) return explicit
  const base = remoteBase()
  if (base) return `${base}/availability`
  return '/api/availability'
}

/** Reservation submit endpoint for the booking widget. */
export function reservationUrl(override?: string | null): string {
  const explicit = override?.trim()
  if (explicit) return explicit
  const base = remoteBase()
  if (base) return `${base}/reservations`
  return '/api/reservation'
}

/**
 * POST headers for reservation submit.
 * Remote calls use text/plain so the browser sends a "simple" cross-origin POST
 * (no OPTIONS preflight). Azure Portal CORS allow-lists only cover admin/dev
 * origins; client static sites vary per tenant.
 */
export function reservationPostHeaders(): Record<string, string> {
  if (isRemoteBookingApi()) {
    return { 'Content-Type': 'text/plain;charset=UTF-8' }
  }
  return { 'Content-Type': 'application/json' }
}

/** SetupIntent endpoint for card-on-file (no-show guarantee). */
export function setupIntentUrl(clientId?: string | null): string {
  const resolvedClientId = resolveBuildClientId(clientId)
  const base = remoteBase()
  if (base) {
    return appendClientIdQuery(`${base}/setup-intent`, resolvedClientId)
  }
  return appendClientIdQuery('/api/setup-intent', resolvedClientId)
}
