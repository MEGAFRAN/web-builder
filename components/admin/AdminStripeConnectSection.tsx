'use client'

import { useCallback, useEffect, useState } from 'react'
import { Alert } from '@/components/content/Alert'
import { Button } from '@/components/inputs/Button'
import { AdminModal } from '@/components/admin/AdminModal'
import { adminCopy } from '@/components/admin/admin-copy'
import { adminDataUrl, adminFetch, isRemoteAdminApi } from '@/lib/admin-api'
import {
  STRIPE_CONNECT_COUNTRIES,
  type StripeConnectCountryCode,
} from '@/lib/stripe-connect-countries'
import type { StripeConnectResponse } from '@/types/admin'

export default function AdminStripeConnectSection() {
  const [status, setStatus] = useState<StripeConnectResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')
  const [countryModalOpen, setCountryModalOpen] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState<StripeConnectCountryCode | null>(
    null,
  )

  const fetchStatus = useCallback(async (signal?: { cancelled: boolean }) => {
    setLoading(true)
    setLoadError('')
    try {
      const res = await adminFetch(adminDataUrl('/stripe-connect'))
      if (signal?.cancelled) return
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(j.error ?? adminCopy.stripeConnect.loadError)
      }
      const data = (await res.json()) as StripeConnectResponse
      if (signal?.cancelled) return
      setStatus(data)
    } catch (e) {
      if (signal?.cancelled) return
      setLoadError(e instanceof Error ? e.message : adminCopy.stripeConnect.loadError)
    } finally {
      if (!signal?.cancelled) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const signal = { cancelled: false }
    queueMicrotask(() => {
      void fetchStatus(signal)
    })
    return () => {
      signal.cancelled = true
    }
  }, [fetchStatus])

  function openCountryModal() {
    setActionError('')
    setSelectedCountry(null)
    setCountryModalOpen(true)
  }

  function closeCountryModal() {
    if (connecting) return
    setCountryModalOpen(false)
    setSelectedCountry(null)
  }

  async function handleConnect(country: StripeConnectCountryCode) {
    setActionError('')
    setConnecting(true)
    try {
      const res = await adminFetch(adminDataUrl('/stripe-connect'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country }),
      })
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(j.error ?? adminCopy.stripeConnect.connectError)
      }
      const data = (await res.json()) as StripeConnectResponse
      setStatus(data)
      setCountryModalOpen(false)
      setSelectedCountry(null)
      if (data.onboardingUrl) {
        window.location.assign(data.onboardingUrl)
        return
      }
      await fetchStatus()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : adminCopy.stripeConnect.connectError)
    } finally {
      setConnecting(false)
    }
  }

  const connected =
    status?.accountId != null &&
    (status.detailsSubmitted || status.status === 'mock')

  const pendingOnboarding =
    status?.accountId != null && !status.detailsSubmitted && status.status !== 'mock'

  if (!loading && connected && !loadError) {
    return (
      <Alert
        variant="success"
        title={adminCopy.stripeConnect.connectedTitle}
        message={adminCopy.stripeConnect.connectedMessage}
      />
    )
  }

  return (
    <div className="rounded-xl border border-border bg-background p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground">{adminCopy.stripeConnect.heading}</h2>
      <p className="mt-1 text-sm text-muted">{adminCopy.stripeConnect.intro}</p>

      {loadError ? (
        <div className="mt-4">
          <Alert variant="error" title={adminCopy.common.error} message={loadError} />
        </div>
      ) : null}

      {actionError ? (
        <div className="mt-4">
          <Alert variant="error" title={adminCopy.common.error} message={actionError} />
        </div>
      ) : null}

      {loading ? (
        <p className="mt-4 text-sm text-muted">{adminCopy.common.loading}</p>
      ) : (
        <div className="mt-6 space-y-4">
          {pendingOnboarding ? (
            <Alert
              variant="warning"
              title={adminCopy.stripeConnect.pendingTitle}
              message={adminCopy.stripeConnect.pendingMessage}
            />
          ) : (
            <p className="text-sm text-muted">{adminCopy.stripeConnect.notConnected}</p>
          )}

          {status?.accountId ? (
            <p className="text-xs text-muted">
              {adminCopy.stripeConnect.accountLabel}: {status.accountId}
            </p>
          ) : null}

          {!isRemoteAdminApi() ? (
            <p className="text-sm text-muted">{adminCopy.stripeConnect.localDevNote}</p>
          ) : null}

          <div className="flex justify-end border-t border-border pt-4">
            <button
              type="button"
              onClick={openCountryModal}
              disabled={connecting || loading}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-fg transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {adminCopy.stripeConnect.connectButton}
            </button>
          </div>
        </div>
      )}

      <AdminModal
        open={countryModalOpen}
        title={adminCopy.stripeConnect.countryModalTitle}
        labelledById="stripe-connect-country-title"
        descriptionId="stripe-connect-country-desc"
        onClose={closeCountryModal}
        footer={
          <>
            <Button
              label={adminCopy.common.cancel}
              variant="secondary"
              onClick={closeCountryModal}
            />
            <button
              type="button"
              disabled={!selectedCountry || connecting}
              onClick={() => {
                if (selectedCountry) void handleConnect(selectedCountry)
              }}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-fg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {connecting
                ? adminCopy.common.loading
                : adminCopy.stripeConnect.acceptPaymentsButton}
            </button>
          </>
        }
      >
        <p id="stripe-connect-country-desc" className="mb-4 text-sm text-muted">
          {adminCopy.stripeConnect.countryModalIntro}
        </p>
        <ul className="space-y-2" role="listbox" aria-label={adminCopy.stripeConnect.countryModalTitle}>
          {STRIPE_CONNECT_COUNTRIES.map((entry) => {
            const selected = selectedCountry === entry.code
            return (
              <li key={entry.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => setSelectedCountry(entry.code)}
                  className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                    selected
                      ? 'border-primary bg-primary/5 font-medium text-foreground'
                      : 'border-border bg-background text-foreground hover:border-primary/40'
                  }`}
                >
                  <span>{entry.label}</span>
                  <span className="text-xs text-muted">{entry.code}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </AdminModal>
    </div>
  )
}
