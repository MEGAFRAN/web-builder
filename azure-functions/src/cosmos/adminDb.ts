import { CosmosClient, Container } from '@azure/cosmos'
import type {
  AdminBookingService,
  BookingScheduleFile,
  StoredReservation,
} from '../types/admin'
import { DEFAULT_WEEKLY } from '../validators/bookingCatalog'

let _client: CosmosClient | null = null

function getCosmosClient(): CosmosClient {
  if (_client) return _client
  const endpoint = process.env.COSMOS_ENDPOINT
  const key = process.env.COSMOS_KEY
  if (!endpoint || !key) {
    throw new Error('COSMOS_ENDPOINT and COSMOS_KEY environment variables are required.')
  }
  _client = new CosmosClient({ endpoint, key })
  return _client
}

function adminDatabaseId(): string {
  return process.env.COSMOS_ADMIN_DATABASE ?? 'web-builder-admin'
}

function getAdminContainer(containerId: string): Container {
  return getCosmosClient().database(adminDatabaseId()).container(containerId)
}

export function getReservationsContainer(): Container {
  return getAdminContainer('reservations')
}

export function getServicesContainer(): Container {
  return getAdminContainer('services')
}

export function getScheduleContainer(): Container {
  return getAdminContainer('schedule')
}

type ServicesDocument = {
  id: string
  clientId: string
  services: AdminBookingService[]
}

type ScheduleDocument = BookingScheduleFile & {
  id: string
  clientId: string
}

export async function listReservations(
  clientId: string,
  startDate: string,
  endDate: string,
): Promise<StoredReservation[]> {
  const container = getReservationsContainer()
  const query = {
    query:
      'SELECT * FROM c WHERE c.clientId = @clientId AND c.date >= @startDate AND c.date <= @endDate',
    parameters: [
      { name: '@clientId', value: clientId },
      { name: '@startDate', value: startDate },
      { name: '@endDate', value: endDate },
    ],
  }
  const { resources } = await container.items.query<StoredReservation>(query).fetchAll()
  return resources
}

export async function createReservation(record: StoredReservation): Promise<void> {
  const container = getReservationsContainer()
  await container.items.create(record)
}

export async function getReservationById(
  id: string,
  clientId: string,
): Promise<StoredReservation | null> {
  const container = getReservationsContainer()
  try {
    const { resource } = await container.item(id, clientId).read<StoredReservation>()
    if (!resource || resource.clientId !== clientId) return null
    return resource
  } catch (err) {
    const code = (err as { code?: number }).code
    if (code === 404) return null
    throw err
  }
}

export async function updateReservationById(
  id: string,
  clientId: string,
  mutate: (row: StoredReservation) => StoredReservation,
): Promise<StoredReservation | null> {
  const container = getReservationsContainer()
  try {
    const { resource } = await container.item(id, clientId).read<StoredReservation>()
    if (!resource || resource.clientId !== clientId) return null
    const updated = mutate(resource)
    await container.item(id, clientId).replace(updated)
    return updated
  } catch (err) {
    const code = (err as { code?: number }).code
    if (code === 404) return null
    throw err
  }
}

export async function getServices(clientId: string): Promise<AdminBookingService[]> {
  const container = getServicesContainer()
  try {
    const { resource } = await container.item(clientId, clientId).read<ServicesDocument>()
    if (!resource || resource.clientId !== clientId) return []
    return Array.isArray(resource.services) ? resource.services : []
  } catch (err) {
    const code = (err as { code?: number }).code
    if (code === 404) return []
    throw err
  }
}

export async function upsertServices(
  clientId: string,
  services: AdminBookingService[],
): Promise<void> {
  const container = getServicesContainer()
  const doc: ServicesDocument = { id: clientId, clientId, services }
  await container.items.upsert(doc)
}

export async function getSchedule(clientId: string): Promise<BookingScheduleFile> {
  const container = getScheduleContainer()
  try {
    const { resource } = await container.item(clientId, clientId).read<ScheduleDocument>()
    if (!resource || resource.clientId !== clientId) {
      return { weekly: DEFAULT_WEEKLY, exceptions: [] }
    }
    const weekly = Array.isArray(resource.weekly) ? resource.weekly : DEFAULT_WEEKLY
    const exceptions = Array.isArray(resource.exceptions) ? resource.exceptions : []
    return { weekly, exceptions }
  } catch (err) {
    const code = (err as { code?: number }).code
    if (code === 404) return { weekly: DEFAULT_WEEKLY, exceptions: [] }
    throw err
  }
}

export async function upsertSchedule(
  clientId: string,
  schedule: BookingScheduleFile,
): Promise<void> {
  const container = getScheduleContainer()
  const doc: ScheduleDocument = { id: clientId, clientId, ...schedule }
  await container.items.upsert(doc)
}

export type AdminClientConfig = {
  displayName: string
  logoUrl: string | null
}

export async function getAdminClientConfig(clientId: string): Promise<AdminClientConfig | null> {
  const container = getAdminContainer('admin-users')
  const query = {
    query: 'SELECT TOP 1 c.displayName, c.logoUrl FROM c WHERE c.clientId = @clientId',
    parameters: [{ name: '@clientId', value: clientId }],
  }
  const { resources } = await container.items
    .query<{ displayName?: string; logoUrl?: string | null }>(query)
    .fetchAll()
  const row = resources[0]
  if (!row) return null
  return {
    displayName: typeof row.displayName === 'string' && row.displayName.trim().length > 0
      ? row.displayName.trim()
      : clientId,
    logoUrl: typeof row.logoUrl === 'string' && row.logoUrl.trim().length > 0
      ? row.logoUrl.trim()
      : null,
  }
}
