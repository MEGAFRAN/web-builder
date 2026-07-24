'use client'

import { useEffect } from 'react'
import { resolveBuildClientId } from '@/lib/client-id'
import {
  buildTelemetryPayload,
  getTelemetryEndpoint,
  resolveConversionEventType,
  sendTelemetryEvent,
  shouldSendTelemetryClick,
} from '@/lib/telemetry'

export function ConversionTelemetry() {
  useEffect(() => {
    const endpoint = getTelemetryEndpoint()
    const siteId = resolveBuildClientId()
    if (!endpoint || !siteId) return

    const lastClickByHref = new Map<string, number>()

    const handleClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      const anchor = target.closest('a[href]')
      if (!(anchor instanceof HTMLAnchorElement)) return
      const href = anchor.href
      const eventType = resolveConversionEventType(href)
      if (!eventType) return
      if (!shouldSendTelemetryClick(href, Date.now(), lastClickByHref)) return
      sendTelemetryEvent(endpoint, buildTelemetryPayload(siteId, eventType))
    }

    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [])

  return null
}
