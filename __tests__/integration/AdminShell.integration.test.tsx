import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react'
import AdminShell from '@/components/admin/AdminShell'
import { adminCopy } from '@/components/admin/admin-copy'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const session = { email: 'owner@example.com', clientId: 'acme-spa' }

const defaultClientConfig = { displayName: 'Acme Spa', logoUrl: null as string | null }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function jsonResponse(data: unknown, ok = true): Response {
  return {
    ok,
    json: async () => data,
  } as Response
}

async function flushClientConfig(expectedDisplayName = defaultClientConfig.displayName) {
  await waitFor(() => {
    expect(vi.mocked(fetch)).toHaveBeenCalled()
  })
  await waitFor(() => {
    expect(screen.getAllByText(expectedDisplayName).length).toBeGreaterThan(0)
  })
}

async function renderAdminShell(children: React.ReactNode) {
  const view = render(<AdminShell>{children}</AdminShell>)
  await flushClientConfig()
  return view
}

function mockClientConfigFetch(
  config: { displayName: string; logoUrl: string | null } = defaultClientConfig,
) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(config))
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
    session,
    signOut: mockSignOut,
  }),
}))

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AdminShell', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    mockSignOut.mockReset()
    mockPathname.mockReturnValue('/admin/bookings')
    fetchSpy = mockClientConfigFetch()
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  describe('initial load', () => {
    it('fetches client config and renders the page content inside the shell', async () => {
      await renderAdminShell(<p>Dashboard content</p>)

      expect(fetch).toHaveBeenCalledWith('/api/admin/client-config', { credentials: 'include' })
      expect(screen.getByText('Dashboard content')).toBeInTheDocument()
      expect(screen.getAllByText(defaultClientConfig.displayName).length).toBeGreaterThan(0)
    })

    it('falls back to the client id when client config cannot be loaded', async () => {
      fetchSpy.mockRestore()
      fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'))

      render(<AdminShell><span>inner</span></AdminShell>)

      await waitFor(() => {
        expect(screen.getAllByText(session.clientId).length).toBeGreaterThan(0)
      })

      const sidebar = screen.getByRole('complementary')
      expect(within(sidebar).getByText('A')).toBeInTheDocument()
      expect(screen.getByText('inner')).toBeInTheDocument()
    })
  })

  describe('branding', () => {
    it('shows initials before config loads and a logo image after logoUrl is returned', async () => {
      render(<AdminShell><span>inner</span></AdminShell>)

      expect(screen.queryByRole('img')).not.toBeInTheDocument()
      const sidebar = screen.getByRole('complementary')
      expect(within(sidebar).getByText('A')).toBeInTheDocument()

      await flushClientConfig()

      fetchSpy.mockRestore()
      fetchSpy = mockClientConfigFetch({
        displayName: 'Beta Co',
        logoUrl: 'https://example.com/logo.png',
      })

      render(<AdminShell><span>inner 2</span></AdminShell>)
      await flushClientConfig('Beta Co')

      await waitFor(() => {
        const img = document.querySelector('aside img[src="https://example.com/logo.png"]')
        expect(img).not.toBeNull()
      })
    })
  })

  describe('sidebar navigation', () => {
    it('exposes links for all admin routes and marks the active section', async () => {
      mockPathname.mockReturnValue('/admin/services/extra')
      await renderAdminShell(<span>services page</span>)

      const nav = screen.getByRole('navigation', { name: adminCopy.nav.ariaAdmin })
      expect(nav.querySelector('a[href="/admin/bookings"]')).toBeTruthy()
      expect(nav.querySelector('a[href="/admin/services"]')).toBeTruthy()
      expect(nav.querySelector('a[href="/admin/availability"]')).toBeTruthy()
      expect(nav.querySelector('a[href="/admin/settings"]')).toBeTruthy()

      const servicesLink = nav.querySelector('a[href="/admin/services"]')
      expect(servicesLink).toHaveAttribute('aria-current', 'page')
    })

    it('calls signOut from the desktop sidebar', async () => {
      await renderAdminShell(<span>kids</span>)

      const sidebar = screen.getByRole('complementary')
      fireEvent.click(within(sidebar).getByRole('button', { name: adminCopy.nav.signOut }))

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('mobile chrome', () => {
    it.each([
      ['/admin/bookings', adminCopy.nav.bookings],
      ['/admin/services/extra', adminCopy.nav.services],
      ['/admin/availability', adminCopy.nav.availability],
      ['/admin/settings', adminCopy.nav.settings],
    ] as const)('highlights "%s" in the mobile bottom bar as "%s"', async (pathname, title) => {
      mockPathname.mockReturnValue(pathname)
      await renderAdminShell(<p>Page body</p>)

      const sectionNav = screen.getByRole('navigation', { name: adminCopy.nav.ariaSections })
      expect(within(sectionNav).getAllByText(title).length).toBeGreaterThan(0)
      expect(screen.getByText('Page body')).toBeInTheDocument()
    })

    it('does not mark a mobile tab as current on unknown admin paths', async () => {
      mockPathname.mockReturnValue('/admin/unknown')
      await renderAdminShell(<p>Page body</p>)

      const sectionNav = screen.getByRole('navigation', { name: adminCopy.nav.ariaSections })
      expect(sectionNav.querySelector('[aria-current="page"]')).toBeNull()
    })

    it('opens the mobile drawer with navigation and closes it from the overlay', async () => {
      await renderAdminShell(<span>mobile page</span>)

      fireEvent.click(screen.getByRole('button', { name: adminCopy.nav.menu }))

      const drawer = await screen.findByRole('dialog', {
        name: adminCopy.nav.adminMenuTitle(defaultClientConfig.displayName),
      })
      expect(within(drawer).getByRole('navigation', { name: adminCopy.nav.ariaAdmin })).toBeInTheDocument()
      expect(within(drawer).getByRole('button', { name: adminCopy.nav.signOut })).toBeInTheDocument()

      fireEvent.click(screen.getAllByRole('button', { name: adminCopy.common.closeMenu })[0])
      await waitFor(() => {
        expect(screen.queryByRole('dialog', { name: adminCopy.nav.adminMenuTitle(defaultClientConfig.displayName) })).not.toBeInTheDocument()
      })
    })

    it('calls signOut from the mobile drawer', async () => {
      await renderAdminShell(<span>mobile page</span>)

      fireEvent.click(screen.getByRole('button', { name: adminCopy.nav.menu }))
      const drawer = await screen.findByRole('dialog', {
        name: adminCopy.nav.adminMenuTitle(defaultClientConfig.displayName),
      })
      fireEvent.click(within(drawer).getByRole('button', { name: adminCopy.nav.signOut }))

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('main layout', () => {
    it.each([
      ['/admin/availability', 'availability body'],
      ['/admin/bookings', 'bookings body'],
    ] as const)('uses a full-width container on %s', async (route, bodyText) => {
      mockPathname.mockReturnValue(route)
      await renderAdminShell(<span>{bodyText}</span>)

      const container = document.querySelector('[data-component="container"]')
      expect(container).not.toBeNull()
      expect(container?.className).toContain('max-w-full')
      expect(screen.getByText(bodyText)).toBeInTheDocument()
    })

    it('uses an xl container on services and settings routes', async () => {
      mockPathname.mockReturnValue('/admin/settings')
      await renderAdminShell(<span>settings body</span>)

      const container = document.querySelector('[data-component="container"]')
      expect(container?.className).toContain('max-w-xl')
      expect(screen.getByText('settings body')).toBeInTheDocument()
    })
  })
})
