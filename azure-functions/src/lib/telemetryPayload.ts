export type ConversionEventType = 'click_whatsapp' | 'click_phone'

export type TelemetryPayload = {
  site_id: string
  event_type: ConversionEventType
  timestamp: string
}

const EVENT_TYPES = new Set<ConversionEventType>(['click_whatsapp', 'click_phone'])

export function isValidTelemetryPayload(body: unknown): body is TelemetryPayload {
  if (typeof body !== 'object' || body === null) return false
  const b = body as Record<string, unknown>
  return (
    typeof b.site_id === 'string' &&
    b.site_id.trim().length > 0 &&
    typeof b.event_type === 'string' &&
    EVENT_TYPES.has(b.event_type as ConversionEventType) &&
    typeof b.timestamp === 'string' &&
    b.timestamp.trim().length > 0 &&
    !Number.isNaN(Date.parse(b.timestamp))
  )
}

export function dateFromTimestamp(timestamp: string): string {
  return new Date(timestamp).toISOString().slice(0, 10)
}
