import { getClientConfig } from '@/lib/client-config'
import { bookingServicesUrl, isRemoteBookingApi } from '@/lib/booking-api'
import { parseBookingCatalogRows } from '@/lib/booking-catalog'
import { readBookingServices } from '@/lib/booking-services-db'
import type { Block, ReservationServiceItem } from '@/types/cms'

const catalogCache = new Map<string, ReservationServiceItem[]>()

/** Test helper — module cache persists across imports within one build/test run. */
export function clearBookingServicesCatalogCache(): void {
  catalogCache.clear()
}

export function pageUsesBookingCatalog(blocks: Block[]): boolean {
  return blocks.some(
    (block) => block._type === 'services' || block._type === 'reservationBlock',
  )
}

async function fetchRemoteBookingCatalog(clientId: string): Promise<ReservationServiceItem[] | null> {
  if (!isRemoteBookingApi()) return null

  let servicesEndpoint: string | undefined
  try {
    servicesEndpoint = getClientConfig(clientId).bookingServicesEndpoint
  } catch {
    servicesEndpoint = undefined
  }

  const url = bookingServicesUrl(clientId, servicesEndpoint)
  console.log(`[build] booking-services fetch → ${url}`)

  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) {
      console.warn(`[build] booking-services fetch failed: HTTP ${res.status} from ${url}`)
      return null
    }
    const data = (await res.json()) as { services?: unknown }
    const rows = parseBookingCatalogRows(data?.services)
    console.log(`[build] booking-services: loaded ${rows.length} service(s) for "${clientId}"`)
    return rows
  } catch (err) {
    console.warn(`[build] booking-services fetch threw for ${url}:`, err)
    return null
  }
}

/**
 * Load the admin-managed services catalog at SSG build time (one fetch per deploy, cached per client).
 * Falls back to local JSON when no remote booking API is configured or the fetch fails.
 */
export async function getBookingServicesCatalog(
  clientId: string,
): Promise<ReservationServiceItem[]> {
  const cached = catalogCache.get(clientId)
  if (cached) return cached

  const remote = await fetchRemoteBookingCatalog(clientId)
  if (remote !== null) {
    catalogCache.set(clientId, remote)
    return remote
  }

  const envClientId = process.env.CLIENT_ID
  if (envClientId && envClientId !== clientId) {
    catalogCache.set(clientId, [])
    return []
  }

  console.log(`[build] booking-services: using local JSON fallback for "${clientId}"`)
  const localServices = await readBookingServices()
  const catalog = parseBookingCatalogRows(localServices)
  catalogCache.set(clientId, catalog)
  return catalog
}
