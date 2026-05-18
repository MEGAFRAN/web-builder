import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import AdminShell from '@/components/admin/AdminShell'

const mockPush = vi.fn()
const mockRefresh = vi.fn()
const mockPathname = vi.fn(() => '/admin/bookings')

vi.mock('next/link', () => ({
  default ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode
    href: string
    [key: string]: unknown
  }) {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    )
  },
}))

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}))

describe('AdminShell', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockPush.mockReset()
    mockRefresh.mockReset()
    mockPathname.mockReturnValue('/admin/bookings')
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({}),
        }),
      ),
    )
  })

  it.each([
    ['/admin/bookings', 'Bookings'],
    ['/admin/services/extra', 'Services'],
    ['/admin/availability', 'Availability'],
    ['/admin/settings', 'Settings'],
  ] as const)('uses pathname "%s" to show section "%s" in mobile bottom bar', (pathname, title) => {
    mockPathname.mockReturnValue(pathname)
    render(
      <AdminShell businessName="Acme Spa">
        <p>Page body</p>
      </AdminShell>,
    )

    const headers = screen.getAllByText(title)
    expect(headers.length).toBeGreaterThan(0)
    expect(screen.getByText('Page body')).toBeInTheDocument()
  })

  it('does not mark a mobile tab as current on unknown admin paths', () => {
    mockPathname.mockReturnValue('/admin/unknown')
    render(
      <AdminShell businessName="Acme Spa">
        <p>Page body</p>
      </AdminShell>,
    )

    const sectionNav = screen.getByRole('navigation', { name: 'Admin sections' })
    expect(sectionNav.querySelector('[aria-current="page"]')).toBeNull()
    expect(screen.getByText('Page body')).toBeInTheDocument()
  })

  it('shows logo image when logoUrl is set and otherwise shows initials fallback', () => {
    const { rerender } = render(
      <AdminShell businessName="Beta Co">
        <span>inner</span>
      </AdminShell>,
    )

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    const sidebar = screen.getByRole('complementary')
    expect(within(sidebar).getByText('B')).toBeInTheDocument()

    rerender(
      <AdminShell businessName="Beta Co" logoUrl="https://example.com/logo.png">
        <span>inner</span>
      </AdminShell>,
    )

    const img = document.querySelector('aside img[src="https://example.com/logo.png"]')
    expect(img).not.toBeNull()
  })

  it('posts logout then navigates to /admin/login when Sign out is used', async () => {
    render(
      <AdminShell businessName="Gamma">
        <span>kids</span>
      </AdminShell>,
    )

    fireEvent.click(screen.getAllByRole('button', { name: /sign out/i })[0])

    await vi.waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/admin/auth/logout', { method: 'POST' })
      expect(mockPush).toHaveBeenCalledWith('/admin/login')
      expect(mockRefresh).toHaveBeenCalled()
    })
  })

  it('uses full-width main container on Availability so wide layouts can use the sidebar-to-edge space', () => {
    mockPathname.mockReturnValue('/admin/availability')
    render(
      <AdminShell businessName="Wide Co">
        <span>availability body</span>
      </AdminShell>,
    )

    const container = document.querySelector('[data-component="container"]')
    expect(container).not.toBeNull()
    expect(container?.className).toContain('max-w-full')
    expect(screen.getByText('availability body')).toBeInTheDocument()
  })

  it('uses xl container on non-availability routes and exposes sidebar navigation links for all admin routes', () => {
    mockPathname.mockReturnValue('/admin/bookings')
    render(
      <AdminShell businessName="Delta">
        <span>x</span>
      </AdminShell>,
    )

    const container = document.querySelector('[data-component="container"]')
    expect(container?.className).toContain('max-w-xl')

    const nav = screen.getByRole('navigation', { name: 'Admin' })
    expect(nav.querySelector('a[href="/admin/bookings"]')).toBeTruthy()
    expect(nav.querySelector('a[href="/admin/services"]')).toBeTruthy()
    expect(nav.querySelector('a[href="/admin/availability"]')).toBeTruthy()
    expect(nav.querySelector('a[href="/admin/settings"]')).toBeTruthy()
  })
})
