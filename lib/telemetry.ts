export type ConversionEventType = 'click_whatsapp' | 'click_phone'

export const TELEMETRY_CLICK_THROTTLE_MS = 2000

export function shouldSendTelemetryClick(
  href: string,
  now: number,
  lastByHref: Map<string, number>,
  throttleMs: number = TELEMETRY_CLICK_THROTTLE_MS,
): boolean {
  const lastClick = lastByHref.get(href)
  if (lastClick !== undefined && now - lastClick < throttleMs) return false
  lastByHref.set(href, now)
  return true
}

export function getTelemetryEndpoint(): string | null {
  const url = process.env.NEXT_PUBLIC_TELEMETRY_URL?.trim()
  if (!url) return null
  return url.replace(/\/$/, '')
}

export function resolveConversionEventType(href: string): ConversionEventType | null {
  const lower = href.trim().toLowerCase()
  if (lower.startsWith('tel:')) return 'click_phone'
  if (
    lower.includes('wa.me') ||
    lower.includes('api.whatsapp.com') ||
    lower.includes('wa.link')
  ) {
    return 'click_whatsapp'
  }
  return null
}

export function buildTelemetryPayload(siteId: string, eventType: ConversionEventType): string {
  return JSON.stringify({
    site_id: siteId,
    event_type: eventType,
    timestamp: new Date().toISOString(),
  })
}

export function sendTelemetryEvent(endpoint: string, body: string): void {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const sent = navigator.sendBeacon(endpoint, body)
      if (sent) return
    }
    void fetch(endpoint, {
      method: 'POST',
      body,
      keepalive: true,
      headers: { 'Content-Type': 'text/plain' },
    }).catch(() => {})
  } catch {
    // Fail silently — never block navigation.
  }
}
