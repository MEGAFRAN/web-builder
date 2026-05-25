'use client'

import { useEffect, useState } from 'react'
import { parseBookingCatalogRows } from '@/lib/booking-catalog'
import type { ReservationServiceItem } from '@/types/cms'

export function useBookingServicesCatalog(clientId?: string | null) {
  const [liveCatalog, setLiveCatalog] = useState<ReservationServiceItem[] | null>(null)

  useEffect(() => {
    let cancelled = false
    const qs = clientId ? `?clientId=${encodeURIComponent(clientId)}` : ''
    fetch(`/api/booking-services${qs}`)
      .then(r => (r.ok ? r.json() : null))
      .then((data: { services?: unknown } | null) => {
        if (cancelled) return
        setLiveCatalog(parseBookingCatalogRows(data?.services))
      })
      .catch(() => {
        if (!cancelled) setLiveCatalog([])
      })
    return () => {
      cancelled = true
    }
  }, [clientId])

  return {
    liveCatalog,
    catalogLoaded: liveCatalog !== null,
  }
}
