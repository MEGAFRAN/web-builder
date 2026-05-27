import { getReservationsContainer } from './adminDb'
import { getClientProfileContainer } from './clientProfileContainer'

export type TenantBookingSettings = {
  enforceGuarantee: boolean
  cancellationFeePercent?: number
  currency?: 'USD' | 'EUR' | 'GBP'
}

type TenantSettingsDocument = {
  id: string
  clientId: string
  bookingSettings: TenantBookingSettings
}

export const DEFAULT_TENANT_BOOKING_SETTINGS: TenantBookingSettings = {
  enforceGuarantee: true,
  cancellationFeePercent: 50,
  currency: 'EUR',
}

const docId = (clientId: string) => `${clientId}-settings`

export async function readTenantBookingSettings(
  clientId: string,
): Promise<TenantBookingSettings | null> {
  const container = getClientProfileContainer()
  try {
    const { resource } = await container
      .item(docId(clientId), clientId)
      .read<TenantSettingsDocument>()
    if (!resource || resource.clientId !== clientId) return null
    return resource.bookingSettings ?? null
  } catch (err) {
    const code = (err as { code?: number }).code
    if (code === 404) return null
    throw err
  }
}

export async function upsertTenantBookingSettings(
  clientId: string,
  bookingSettings: TenantBookingSettings,
): Promise<void> {
  const container = getClientProfileContainer()
  const doc: TenantSettingsDocument = {
    id: docId(clientId),
    clientId,
    bookingSettings,
  }
  await container.items.upsert(doc)
}

async function tenantHasGuaranteedReservations(clientId: string): Promise<boolean> {
  const container = getReservationsContainer()
  const query = {
    query:
      'SELECT TOP 1 c.id FROM c WHERE c.clientId = @clientId AND IS_DEFINED(c.guarantee.paymentMethodId)',
    parameters: [{ name: '@clientId', value: clientId }],
  }
  const { resources } = await container.items.query<{ id: string }>(query).fetchAll()
  return resources.length > 0
}

/** Idempotent: only writes when the Cosmos settings doc is missing. */
export async function ensureTenantBookingSettings(
  clientId: string,
  bookingSettings: TenantBookingSettings,
): Promise<TenantBookingSettings> {
  const existing = await readTenantBookingSettings(clientId)
  if (existing) return existing
  await upsertTenantBookingSettings(clientId, bookingSettings)
  return bookingSettings
}

/**
 * Read tenant booking settings from Cosmos. If missing, backfill when the tenant
 * already has card-on-file reservations (self-heals legacy clients).
 */
export async function resolveTenantBookingSettings(
  clientId: string,
): Promise<TenantBookingSettings | null> {
  const existing = await readTenantBookingSettings(clientId)
  if (existing) return existing

  const hasGuaranteedReservations = await tenantHasGuaranteedReservations(clientId)
  if (!hasGuaranteedReservations) return null

  return ensureTenantBookingSettings(clientId, DEFAULT_TENANT_BOOKING_SETTINGS)
}
