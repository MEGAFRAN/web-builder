import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import SettingsPage from '@/app/admin/(dashboard)/settings/page'

vi.mock('@/components/admin/AdminServicesPage', () => ({
  default: () => <div data-testid="admin-services-route-stub" />,
}))
vi.mock('@/components/admin/AdminAvailabilityPage', () => ({
  default: () => <div data-testid="admin-availability-route-stub" />,
}))
vi.mock('@/components/admin/AdminBookingsPage', () => ({
  default: ({ clientId }: { clientId: string }) => (
    <div data-testid="admin-bookings-route-stub" data-client-id={clientId} />
  ),
}))

describe('AdminSettingsRoutePage (app/admin/(dashboard)/settings/page.tsx)', () => {
  it('renders settings introductory copy', () => {
    render(<SettingsPage />)

    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument()
    expect(screen.getByText(/Business preferences and integrations/i)).toBeInTheDocument()
    expect(screen.getByText(/Contact your platform operator/i)).toBeInTheDocument()
  })
})

describe('delegated dashboard route pages', () => {
  beforeEach(() => {
    vi.stubEnv('CLIENT_ID', 'delegates-client')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

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

  it('AdminBookingsRoutePage passes CLIENT_ID through to AdminBookingsPage', async () => {
    const Route = (await import('@/app/admin/(dashboard)/bookings/page')).default
    render(<Route />)

    const node = screen.getByTestId('admin-bookings-route-stub')
    expect(node).toHaveAttribute('data-client-id', 'delegates-client')
  })
})
