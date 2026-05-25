import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import SettingsPage from '@/app/admin/(dashboard)/settings/page'
import { adminCopy } from '@/components/admin/admin-copy'

vi.mock('@/lib/admin-api', () => ({
  adminFetch: vi.fn(),
  adminDataUrl: (path: string) => `/api/admin${path}`,
  isRemoteAdminApi: () => false,
}))

import { adminFetch } from '@/lib/admin-api'

vi.mock('@/components/admin/AdminServicesPage', () => ({
  default: () => <div data-testid="admin-services-route-stub" />,
}))
vi.mock('@/components/admin/AdminAvailabilityPage', () => ({
  default: () => <div data-testid="admin-availability-route-stub" />,
}))
vi.mock('@/components/admin/AdminBookingsPage', () => ({
  default: () => <div data-testid="admin-bookings-route-stub" />,
}))

describe('AdminSettingsRoutePage (app/admin/(dashboard)/settings/page.tsx)', () => {
  beforeEach(() => {
    vi.mocked(adminFetch).mockResolvedValue({
      ok: true,
      json: async () => ({ profile: null }),
    } as Response)
  })

  it('renders settings introductory copy', async () => {
    render(<SettingsPage />)

    expect(screen.getByRole('heading', { name: adminCopy.settings.heading })).toBeInTheDocument()
    expect(await screen.findByText(adminCopy.settings.intro)).toBeInTheDocument()
  })
})

describe('delegated dashboard route pages', () => {
  it('AdminServicesRoutePage renders AdminServicesPage', async () => {
    const Route = (await import('@/app/admin/(dashboard)/services/page')).default
    render(<Route />)

    expect(screen.getByTestId('admin-services-route-stub')).toBeInTheDocument()
  })

  it('AdminAvailabilityRoutePage renders AdminAvailabilityPage', async () => {
    const Route = (await import('@/app/admin/(dashboard)/availability/page')).default
    render(<Route />)

    expect(screen.getByTestId('admin-availability-route-stub')).toBeInTheDocument()
  })

  it('AdminBookingsRoutePage renders AdminBookingsPage', async () => {
    const Route = (await import('@/app/admin/(dashboard)/bookings/page')).default
    render(<Route />)

    expect(screen.getByTestId('admin-bookings-route-stub')).toBeInTheDocument()
  })
})
