import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { ConversionSummaryCard } from '@/components/admin/ConversionSummaryCard'
import { adminCopy } from '@/components/admin/admin-copy'

vi.mock('@/lib/admin-api', () => ({
  adminFetch: vi.fn(),
  adminTelemetrySummaryUrl: vi.fn(() => '/api/admin/telemetry/summary'),
}))

import { adminFetch } from '@/lib/admin-api'

const mockAdminFetch = vi.mocked(adminFetch)

describe('ConversionSummaryCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows skeleton while loading', () => {
    mockAdminFetch.mockReturnValue(new Promise(() => {}))

    render(<ConversionSummaryCard />)

    expect(screen.getByLabelText(adminCopy.conversionSummary.loading)).toBeInTheDocument()
  })

  it('shows WhatsApp, phone, and total counts on success', async () => {
    mockAdminFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        month: '2026-07',
        counters: { click_whatsapp: 47, click_phone: 23 },
        total: 70,
      }),
    } as Response)

    render(<ConversionSummaryCard />)

    await waitFor(() => {
      expect(screen.getByText(adminCopy.conversionSummary.title)).toBeInTheDocument()
    })
    expect(screen.getByText('47 clics en WhatsApp')).toBeInTheDocument()
    expect(screen.getByText('23 llamadas desde la web')).toBeInTheDocument()
    expect(screen.getByText('70 contactos')).toBeInTheDocument()
  })

  it('shows empty state when all counters are zero', async () => {
    mockAdminFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        month: '2026-07',
        counters: { click_whatsapp: 0, click_phone: 0 },
        total: 0,
      }),
    } as Response)

    render(<ConversionSummaryCard />)

    await waitFor(() => {
      expect(screen.getByText(adminCopy.conversionSummary.empty)).toBeInTheDocument()
    })
  })

  it('shows error state on fetch failure', async () => {
    mockAdminFetch.mockResolvedValue({ ok: false, status: 500 } as Response)

    render(<ConversionSummaryCard />)

    await waitFor(() => {
      expect(screen.getByText(adminCopy.conversionSummary.error)).toBeInTheDocument()
    })
  })
})
