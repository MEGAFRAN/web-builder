import { promises as fs } from 'fs'
import path from 'path'
import type { ConversionEventType } from '@/lib/telemetry'

export type TelemetryDayBucket = {
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

const LOCAL_DB_PATH = path.join(process.cwd(), 'data', 'telemetry-local.json')

async function readBuckets(): Promise<TelemetryDayBucket[]> {
  try {
    const raw = await fs.readFile(LOCAL_DB_PATH, 'utf-8')
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as TelemetryDayBucket[]) : []
  } catch {
    return []
  }
}

async function writeBuckets(rows: TelemetryDayBucket[]): Promise<void> {
  await fs.mkdir(path.dirname(LOCAL_DB_PATH), { recursive: true })
  await fs.writeFile(LOCAL_DB_PATH, JSON.stringify(rows, null, 2))
}

function emptyCounters(): Record<ConversionEventType, number> {
  return { click_whatsapp: 0, click_phone: 0 }
}

export async function incrementTelemetryCounter(
  siteId: string,
  eventType: ConversionEventType,
  date?: string,
): Promise<void> {
  const bucketDate = date ?? new Date().toISOString().slice(0, 10)
  const id = `${siteId}:${bucketDate}`
  const rows = await readBuckets()
  const ix = rows.findIndex((r) => r.id === id)

  if (ix === -1) {
    const counters = emptyCounters()
    counters[eventType] = 1
    rows.push({ id, site_id: siteId, date: bucketDate, counters })
  } else {
    rows[ix].counters[eventType] = (rows[ix].counters[eventType] ?? 0) + 1
  }

  await writeBuckets(rows)
}

export async function readTelemetryCounters(siteId?: string): Promise<TelemetryDayBucket[]> {
  const rows = await readBuckets()
  if (!siteId) return rows
  return rows.filter((r) => r.site_id === siteId)
}

export async function aggregateMonthlySummary(
  siteId: string,
  month?: string,
): Promise<TelemetrySummary> {
  const monthKey = month ?? new Date().toISOString().slice(0, 7)
  const rows = await readTelemetryCounters(siteId).then((all) =>
    all.filter((r) => r.date.startsWith(`${monthKey}-`)),
  )

  const counters = emptyCounters()
  for (const row of rows) {
    counters.click_whatsapp += row.counters.click_whatsapp ?? 0
    counters.click_phone += row.counters.click_phone ?? 0
  }

  return {
    month: monthKey,
    counters,
    total: counters.click_whatsapp + counters.click_phone,
  }
}
