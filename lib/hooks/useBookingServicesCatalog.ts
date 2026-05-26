'use client'

import { useEffect, useState } from 'react'
import { bookingServicesUrl } from '@/lib/booking-api'
import { parseBookingCatalogRows } from '@/lib/booking-catalog'
import type { ReservationServiceItem } from '@/types/cms'

export function useBookingServicesCatalog(
  clientId?: string | null,
  servicesEndpoint?: string | null,
) {
  const [liveCatalog, setLiveCatalog] = useState<ReservationServiceItem[] | null>(null)

  useEffect(() => {
    let cancelled = false
    const url = bookingServicesUrl(clientId, servicesEndpoint)
    fetch(url)
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
  }, [clientId, servicesEndpoint])

  return {
    liveCatalog,
    catalogLoaded: liveCatalog !== null,
  }
}
