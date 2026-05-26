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
