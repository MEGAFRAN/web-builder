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
