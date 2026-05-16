import { CosmosClient, Container } from '@azure/cosmos'

let _container: Container | null = null

export function getContainer(): Container {
  if (_container) return _container

  const endpoint = process.env.COSMOS_ENDPOINT
  const key = process.env.COSMOS_KEY
  const databaseId = process.env.COSMOS_DATABASE ?? 'reservations'
  const containerId = process.env.COSMOS_CONTAINER ?? 'bookings'

  if (!endpoint || !key) {
    throw new Error('COSMOS_ENDPOINT and COSMOS_KEY environment variables are required.')
  }

  const client = new CosmosClient({ endpoint, key })
  _container = client.database(databaseId).container(containerId)
  return _container
}
