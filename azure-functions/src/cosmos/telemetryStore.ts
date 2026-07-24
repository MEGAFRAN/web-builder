import { CosmosClient, Container } from '@azure/cosmos'

export type ConversionEventType = 'click_whatsapp' | 'click_phone'

export type TelemetryDayDocument = {
  id: string
  site_id: string
  date: string
  counters: Record<ConversionEventType, number>
}

export type TelemetrySummary = {
  month: string
  counters: Record<ConversionEventType, number>
  total: number
}

let _container: Container | null = null

function getTelemetryContainer(): Container {
  if (_container) return _container

  const endpoint = process.env.COSMOS_ENDPOINT
  const key = process.env.COSMOS_KEY
  const databaseId = process.env.COSMOS_ADMIN_DATABASE ?? 'web-builder-admin'
  const containerId = 'telemetry-counters'

  if (!endpoint || !key) {
    throw new Error('COSMOS_ENDPOINT and COSMOS_KEY environment variables are required.')
  }

  const client = new CosmosClient({ endpoint, key })
  _container = client.database(databaseId).container(containerId)
  return _container
}

function emptyCounters(): Record<ConversionEventType, number> {
  return { click_whatsapp: 0, click_phone: 0 }
}

export async function incrementTelemetryCounter(
  siteId: string,
  eventType: ConversionEventType,
  date: string,
): Promise<void> {
  const container = getTelemetryContainer()
  const id = `${siteId}:${date}`

  try {
    await container.item(id, siteId).patch([
      { op: 'incr', path: `/counters/${eventType}`, value: 1 },
    ])
    return
  } catch (err) {
    const code = (err as { code?: number }).code
    if (code !== 404) throw err
  }

  const counters = emptyCounters()
  counters[eventType] = 1
  const doc: TelemetryDayDocument = { id, site_id: siteId, date, counters }
  await container.items.upsert(doc)
}

export async function aggregateMonthlySummary(
  siteId: string,
  month: string,
): Promise<TelemetrySummary> {
  const container = getTelemetryContainer()
  const query = {
    query:
      'SELECT c.counters FROM c WHERE c.site_id = @siteId AND STARTSWITH(c.date, @monthPrefix)',
    parameters: [
      { name: '@siteId', value: siteId },
      { name: '@monthPrefix', value: `${month}-` },
    ],
  }

  const { resources } = await container.items
    .query<{ counters?: Partial<Record<ConversionEventType, number>> }>(query)
    .fetchAll()

  const counters = emptyCounters()
  for (const row of resources) {
    counters.click_whatsapp += row.counters?.click_whatsapp ?? 0
    counters.click_phone += row.counters?.click_phone ?? 0
  }

  return {
    month,
    counters,
    total: counters.click_whatsapp + counters.click_phone,
  }
}
