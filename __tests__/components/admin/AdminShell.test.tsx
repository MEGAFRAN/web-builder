import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react'
import AdminShell from '@/components/admin/AdminShell'
import { adminCopy } from '@/components/admin/admin-copy'

const defaultClientConfig = { displayName: 'Acme Spa', logoUrl: null as string | null }

async function flushAdminShellConfig(expectedDisplayName = defaultClientConfig.displayName) {
  await waitFor(() => {
    expect(vi.mocked(fetch)).toHaveBeenCalled()
  })
  await waitFor(() => {
    expect(screen.getAllByText(expectedDisplayName).length).toBeGreaterThan(0)
  })
}

async function renderAdminShell(children: React.ReactNode) {
  const view = render(<AdminShell>{children}</AdminShell>)
  await flushAdminShellConfig()
  return view
}

const mockSignOut = vi.fn(async () => {})
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
}))

vi.mock('@/lib/admin-auth-context', () => ({
  useAdminAuth: () => ({
    session: { email: 'owner@example.com', clientId: 'acme-spa' },
    signOut: mockSignOut,
  }),
}))

describe('AdminShell', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockSignOut.mockReset()
    mockPathname.mockReturnValue('/admin/bookings')
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: async () => defaultClientConfig,
        }),
      ),
    )
  })

  it.each([
    ['/admin/bookings', adminCopy.nav.bookings],
    ['/admin/services/extra', adminCopy.nav.services],
    ['/admin/availability', adminCopy.nav.availability],
    ['/admin/settings', adminCopy.nav.settings],
  ] as const)('uses pathname "%s" to show section "%s" in mobile bottom bar', async (pathname, title) => {
    mockPathname.mockReturnValue(pathname)
    await renderAdminShell(<p>Page body</p>)

    const headers = screen.getAllByText(title)
    expect(headers.length).toBeGreaterThan(0)
    expect(screen.getByText('Page body')).toBeInTheDocument()
  })

  it('does not mark a mobile tab as current on unknown admin paths', async () => {
    mockPathname.mockReturnValue('/admin/unknown')
    await renderAdminShell(<p>Page body</p>)

    const sectionNav = screen.getByRole('navigation', { name: adminCopy.nav.ariaSections })
    expect(sectionNav.querySelector('[aria-current="page"]')).toBeNull()
    expect(screen.getByText('Page body')).toBeInTheDocument()
  })

  it('shows logo image when logoUrl is returned from client config and otherwise shows initials fallback', async () => {
    render(
      <AdminShell>
        <span>inner</span>
      </AdminShell>,
    )

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    const sidebar = screen.getByRole('complementary')
    expect(within(sidebar).getByText('A')).toBeInTheDocument()
    await flushAdminShellConfig()

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ displayName: 'Beta Co', logoUrl: 'https://example.com/logo.png' }),
    } as Response)

    render(
      <AdminShell>
        <span>inner</span>
      </AdminShell>,
    )

    await flushAdminShellConfig('Beta Co')

    await waitFor(() => {
      const img = document.querySelector('aside img[src="https://example.com/logo.png"]')
      expect(img).not.toBeNull()
    })
  })

  it('calls signOut when Sign out is used', async () => {
    await renderAdminShell(<span>kids</span>)

    fireEvent.click(screen.getAllByRole('button', { name: adminCopy.nav.signOut })[0])

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled()
    })
  })

  it.each([
    ['/admin/availability', 'availability body'],
    ['/admin/bookings', 'bookings body'],
  ] as const)(
    'uses full-width main container on %s so wide layouts can use the sidebar-to-edge space',
    async (route, bodyText) => {
      mockPathname.mockReturnValue(route)
      await renderAdminShell(<span>{bodyText}</span>)

      const container = document.querySelector('[data-component="container"]')
      expect(container).not.toBeNull()
      expect(container?.className).toContain('max-w-full')
      expect(screen.getByText(bodyText)).toBeInTheDocument()
    },
  )

  it('uses xl container on services/settings routes and exposes sidebar navigation links for all admin routes', async () => {
    mockPathname.mockReturnValue('/admin/services')
    await renderAdminShell(<span>x</span>)

    const container = document.querySelector('[data-component="container"]')
    expect(container?.className).toContain('max-w-xl')

    const nav = screen.getByRole('navigation', { name: adminCopy.nav.ariaAdmin })
    expect(nav.querySelector('a[href="/admin/bookings"]')).toBeTruthy()
    expect(nav.querySelector('a[href="/admin/services"]')).toBeTruthy()
    expect(nav.querySelector('a[href="/admin/availability"]')).toBeTruthy()
    expect(nav.querySelector('a[href="/admin/settings"]')).toBeTruthy()
  })
})
