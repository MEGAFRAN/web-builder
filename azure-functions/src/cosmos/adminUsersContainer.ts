import { CosmosClient, Container } from '@azure/cosmos'

let _container: Container | null = null

export function getAdminUsersContainer(): Container {
  if (_container) return _container

  const endpoint = process.env.COSMOS_ENDPOINT
  const key = process.env.COSMOS_KEY
  const databaseId = process.env.COSMOS_ADMIN_DATABASE ?? 'web-builder-admin'
  const containerId = 'admin-users'

  if (!endpoint || !key) {
    throw new Error('COSMOS_ENDPOINT and COSMOS_KEY environment variables are required.')
  }

  const client = new CosmosClient({ endpoint, key })
  _container = client.database(databaseId).container(containerId)
  return _container
}

export type AdminUserDocument = {
  id: string
  clientId: string
  email: string
  passwordHash: string
  displayName?: string
  logoUrl?: string | null
}

export async function findAdminUser(
  clientId: string,
  email: string,
): Promise<AdminUserDocument | null> {
  const container = getAdminUsersContainer()
  const query = {
    query:
      'SELECT * FROM c WHERE c.clientId = @clientId AND LOWER(c.email) = @email',
    parameters: [
      { name: '@clientId', value: clientId },
      { name: '@email', value: email.toLowerCase() },
    ],
  }
  const { resources } = await container.items
    .query<AdminUserDocument>(query)
    .fetchAll()
  return resources[0] ?? null
}

export async function clientExists(clientId: string): Promise<boolean> {
  const container = getAdminUsersContainer()
  const query = {
    query: 'SELECT VALUE COUNT(1) FROM c WHERE c.clientId = @clientId',
    parameters: [{ name: '@clientId', value: clientId }],
  }
  const { resources } = await container.items.query<number>(query).fetchAll()
  return (resources[0] ?? 0) > 0
}
