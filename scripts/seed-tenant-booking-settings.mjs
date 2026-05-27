#!/usr/bin/env node
/**
 * Upserts {clientId}-settings into Cosmos client-profile with bookingSettings from client.json.
 * Usage: CLIENT_ID=test node scripts/seed-tenant-booking-settings.mjs
 */
import { CosmosClient } from '@azure/cosmos'
import fs from 'fs'
import path from 'path'

const clientId = process.env.CLIENT_ID?.trim()
if (!clientId) {
  console.error('CLIENT_ID is required')
  process.exit(1)
}

const endpoint = process.env.COSMOS_ENDPOINT
const key = process.env.COSMOS_KEY
if (!endpoint || !key) {
  console.error('COSMOS_ENDPOINT and COSMOS_KEY are required')
  process.exit(1)
}

const databaseId = process.env.COSMOS_ADMIN_DATABASE ?? 'web-builder-admin'
const containerId = process.env.COSMOS_CLIENT_PROFILE_CONTAINER ?? 'client-profile'

const configPath = path.join(process.cwd(), 'config', 'clients', clientId, 'client.json')
const raw = fs.readFileSync(configPath, 'utf-8')
const config = JSON.parse(raw)
const bookingSettings = config.bookingSettings
if (!bookingSettings) {
  console.error(`No bookingSettings in ${configPath}`)
  process.exit(1)
}

const client = new CosmosClient({ endpoint, key })
const container = client.database(databaseId).container(containerId)

await container.items.upsert({
  id: `${clientId}-settings`,
  clientId,
  bookingSettings,
})

console.log(`Upserted ${clientId}-settings with bookingSettings`)
