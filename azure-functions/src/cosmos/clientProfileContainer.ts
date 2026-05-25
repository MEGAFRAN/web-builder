import { CosmosClient, Container } from '@azure/cosmos'

let _container: Container | null = null

export function getClientProfileContainer(): Container {
  if (_container) return _container

  const endpoint = process.env.COSMOS_ENDPOINT
  const key = process.env.COSMOS_KEY
  const databaseId = process.env.COSMOS_ADMIN_DATABASE ?? process.env.COSMOS_DATABASE ?? 'web-builder-admin'
  const containerId = process.env.COSMOS_CLIENT_PROFILE_CONTAINER ?? 'client-profile'

  if (!endpoint || !key) {
    throw new Error('COSMOS_ENDPOINT and COSMOS_KEY environment variables are required.')
  }

  const client = new CosmosClient({ endpoint, key })
  _container = client.database(databaseId).container(containerId)
  return _container
}
