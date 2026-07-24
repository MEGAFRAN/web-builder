'use client'

import { useEffect, useState } from 'react'
import { adminCopy } from '@/components/admin/admin-copy'
import { adminFetch, adminTelemetrySummaryUrl } from '@/lib/admin-api'
import type { TelemetrySummary } from '@/lib/telemetry-local-store'

type LoadState = 'loading' | 'success' | 'error'

export function ConversionSummaryCard() {
  const [state, setState] = useState<LoadState>('loading')
  const [summary, setSummary] = useState<TelemetrySummary | null>(null)

  useEffect(() => {
    let cancelled = false

    void adminFetch(adminTelemetrySummaryUrl())
      .then(async (res) => {
        if (!res.ok) throw new Error('fetch failed')
        return res.json() as Promise<TelemetrySummary>
      })
      .then((data) => {
        if (cancelled) return
        setSummary(data)
        setState('success')
      })
      .catch(() => {
        if (!cancelled) setState('error')
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (state === 'loading') {
    return (
      <div
        className="rounded-2xl border border-border bg-surface p-5 shadow-sm"
        aria-busy="true"
        aria-label={adminCopy.conversionSummary.loading}
      >
        <div className="h-5 w-48 animate-pulse rounded bg-muted-bg" />
        <div className="mt-4 space-y-2">
          <div className="h-4 w-40 animate-pulse rounded bg-muted-bg" />
          <div className="h-4 w-36 animate-pulse rounded bg-muted-bg" />
        </div>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="rounded-2xl border border-border bg-muted-bg px-5 py-4 text-sm text-muted">
        {adminCopy.conversionSummary.error}
      </div>
    )
  }

  const counters = summary?.counters ?? { click_whatsapp: 0, click_phone: 0 }
  const total = summary?.total ?? 0
  const isEmpty = total === 0

  return (
    <section
      className="rounded-2xl border border-border bg-surface p-5 shadow-sm"
      aria-label={adminCopy.conversionSummary.title}
    >
      <h2 className="text-lg font-semibold text-foreground">{adminCopy.conversionSummary.title}</h2>

      {isEmpty ? (
        <p className="mt-3 text-sm text-muted">{adminCopy.conversionSummary.empty}</p>
      ) : (
        <div className="mt-4 space-y-2 text-sm text-foreground">
          <p>{adminCopy.conversionSummary.whatsappLine(counters.click_whatsapp)}</p>
          <p>{adminCopy.conversionSummary.phoneLine(counters.click_phone)}</p>
          <p className="pt-1 text-base font-semibold">
            {adminCopy.conversionSummary.totalLine(total)}
          </p>
        </div>
      )}
    </section>
  )
}
