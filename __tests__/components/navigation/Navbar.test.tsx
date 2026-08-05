import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Navbar } from '@/components/navigation/Navbar'
import { BOOKING_MODAL_OPEN_EVENT } from '@/lib/booking-modal-events'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const twoLinks = [
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
]

const threeLinks = [
  ...twoLinks,
  { label: 'Blog', href: '/blog' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderNavbar(props: React.ComponentProps<typeof Navbar>) {
  const { container } = render(<Navbar {...props} />)
  return container
}

/** Desktop nav bar element — mobile panel is a sibling div outside this element. */
function desktopNav(container: HTMLElement) {
  return container.querySelector('nav[data-component="navbar"]')!
}

/** Mobile panel — the slide-in panel rendered below the nav bar. */
function mobilePanel(container: HTMLElement) {
  return container.querySelector('[data-component="mobile-menu"]')!
}

// ─── Desktop tests ────────────────────────────────────────────────────────────

describe('Navbar', () => {
  describe('root element', () => {
    it('renders a <nav> with data-component="navbar"', () => {
      const container = renderNavbar({ logo: 'Acme' })
      expect(desktopNav(container)).not.toBeNull()
    })

    it('uses surface background and resting shadow for separation from page content', () => {
      const container = renderNavbar({ logo: 'Acme' })
      const nav = desktopNav(container)
      expect(nav.className).toContain('bg-surface')
      expect(nav.className).toContain('shadow-[')
    })

    it('is fixed to the viewport on mobile and sticky from md up', () => {
      const container = renderNavbar({ logo: 'Acme' })
      const nav = desktopNav(container)
      expect(nav.className).toContain('fixed')
      expect(nav.className).toContain('top-0')
      expect(nav.className).toContain('md:sticky')
    })

    it('renders a mobile layout spacer so fixed nav does not overlap content', () => {
      const container = renderNavbar({ logo: 'Acme' })
      const spacer = Array.from(container.querySelectorAll('[aria-hidden="true"]')).find(
        (el) => String(el.className).includes('md:hidden'),
      )
      expect(spacer).toBeDefined()
    })
  })

  describe('logo', () => {
    it('renders the logo text', () => {
      renderNavbar({ logo: 'Acme Corp' })
      expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    })

    it('renders the logo as a link pointing to "/"', () => {
      renderNavbar({ logo: 'Acme Corp' })
      const logoLink = screen.getByRole('link', { name: 'Acme Corp' })
      expect(logoLink).toBeInTheDocument()
      expect(logoLink).toHaveAttribute('href', '/')
    })

    it('applies brand heading typography to the logo link', () => {
      renderNavbar({ logo: 'Acme Corp' })
      const logoLink = screen.getByRole('link', { name: 'Acme Corp' })
      expect(logoLink.className).toContain('text-brand')
      expect(logoLink.className).toContain('font-[family-name:var(--font-heading)]')
      expect(logoLink.className).toContain('font-semibold')
    })

    it('shows pointer cursor on the logo link at all breakpoints', () => {
      renderNavbar({ logo: 'Acme Corp' })
      const logoLink = screen.getByRole('link', { name: 'Acme Corp' })
      expect(logoLink.className).toContain('cursor-pointer')
      expect(logoLink.className).not.toContain('cursor-auto')
    })
  })

  describe('desktop nav links', () => {
    it('renders NavLink components with hover and focus affordances', () => {
      renderNavbar({ logo: 'Acme', links: twoLinks })
      const about = screen.getByRole('link', { name: 'About' })
      expect(about.getAttribute('data-component')).toBe('nav-link')
      expect(about.className).toContain('transition-colors')
      expect(about.className).toContain('hover:text-primary')
    })
  })

  describe('links — omitted', () => {
    it('renders no nav links (only the logo link) when links is omitted', () => {
      const container = renderNavbar({ logo: 'Acme' })
      const anchors = Array.from(desktopNav(container).querySelectorAll('a'))
      expect(anchors).toHaveLength(1)
    })
  })

  describe('links — null', () => {
    it('renders no nav links when links is null', () => {
      const container = renderNavbar({ logo: 'Acme', links: null })
      const anchors = Array.from(desktopNav(container).querySelectorAll('a'))
      expect(anchors).toHaveLength(1)
    })
  })

  describe('links — multiple items', () => {
    it.each(twoLinks)('renders link "$label" with href "$href"', ({ label, href }) => {
      renderNavbar({ logo: 'Acme', links: twoLinks })
      const link = screen.getByRole('link', { name: label })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', href)
    })

    it('renders exactly the correct number of nav links (excluding logo)', () => {
      const container = renderNavbar({ logo: 'Acme', links: threeLinks })
      // Scope to desktop nav bar — mobile panel is a sibling div outside <nav>
      const anchors = Array.from(desktopNav(container).querySelectorAll('a'))
      expect(anchors).toHaveLength(1 + threeLinks.length)
    })

    it('renders links in document order matching the links array', () => {
      const container = renderNavbar({ logo: 'Acme', links: twoLinks })
      const navAnchors = Array.from(desktopNav(container).querySelectorAll('a')).filter(
        (a) => a.getAttribute('href') !== '/'
      )
      navAnchors.forEach((anchor, i) => {
        expect(anchor.textContent).toBe(twoLinks[i].label)
        expect(anchor).toHaveAttribute('href', twoLinks[i].href)
      })
    })
  })

  describe('ctaLabel — omitted', () => {
    it('renders no CTA button when ctaLabel is omitted', () => {
      const container = renderNavbar({ logo: 'Acme', links: twoLinks })
      // Hamburger always has aria-label; a missing CTA button has no aria-label
      expect(container.querySelector('button:not([aria-label])')).toBeNull()
    })
  })

  describe('ctaLabel — null', () => {
    it('renders no CTA button when ctaLabel is null', () => {
      const container = renderNavbar({ logo: 'Acme', links: twoLinks, ctaLabel: null })
      expect(container.querySelector('button:not([aria-label])')).toBeNull()
    })
  })

  describe('ctaLabel — provided', () => {
    it('renders a visible <button> with the correct label', () => {
      renderNavbar({ logo: 'Acme', ctaLabel: 'Get Started' })
      const btn = screen.getByRole('button', { name: 'Get Started' })
      expect(btn).toBeInTheDocument()
    })

    it('renders the button text exactly as supplied', () => {
      renderNavbar({ logo: 'Acme', ctaLabel: 'Sign Up Free' })
      expect(screen.getByRole('button', { name: 'Sign Up Free' })).toBeVisible()
    })
  })

  // ctaAction drives the CTA link inside the mobile panel.
  // On desktop the CTA remains a <button> — ctaAction is not wired to it.
  describe('ctaAction prop', () => {
    it('accepts ctaAction without throwing', () => {
      expect(() =>
        renderNavbar({ logo: 'Acme', ctaLabel: 'Go', ctaAction: 'https://example.com' })
      ).not.toThrow()
    })

    it('opens external https CTA links in a new tab on desktop', () => {
      renderNavbar({
        logo: 'Acme',
        ctaLabel: 'Ver cómo queda',
        ctaAction: 'https://moviles.clubtal.com',
      })
      const link = screen.getByRole('link', { name: 'Ver cómo queda' })
      expect(link).toHaveAttribute('href', 'https://moviles.clubtal.com')
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('does not use target blank for internal CTA paths', () => {
      renderNavbar({ logo: 'Acme', ctaLabel: 'Get Started', ctaAction: '/signup' })
      const link = screen.getByRole('link', { name: 'Get Started' })
      expect(link).toHaveAttribute('href', '/signup')
      expect(link).not.toHaveAttribute('target')
    })
  })

  describe('fully populated — logo + links + ctaLabel', () => {
    it('renders all parts together without error', () => {
      renderNavbar({ logo: 'Acme', links: twoLinks, ctaLabel: 'Get Started', ctaAction: '/signup' })

      expect(screen.getByRole('link', { name: 'Acme' })).toHaveAttribute('href', '/')
      expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about')
      expect(screen.getByRole('link', { name: 'Contact' })).toHaveAttribute('href', '/contact')
      expect(screen.getByRole('link', { name: 'Get Started' })).toHaveAttribute(
        'href',
        '/signup',
      )
    })

    it('renders exactly logo + nav links in the desktop bar, with hamburger + CTA as buttons', () => {
      const container = renderNavbar({
        logo: 'Acme',
        links: twoLinks,
        ctaLabel: 'Get Started',
      })
      const anchors = Array.from(desktopNav(container).querySelectorAll('a'))
      const buttons = Array.from(container.querySelectorAll('button'))
      expect(anchors).toHaveLength(1 + twoLinks.length)
      expect(buttons).toHaveLength(2) // hamburger + CTA
    })
  })

  // ─── Mobile menu tests ───────────────────────────────────────────────────────

  describe('mobile menu', () => {
    it('renders the hamburger button with aria-label="Open menu"', () => {
      const container = renderNavbar({ logo: 'Acme', links: twoLinks })
      const hamburger = container.querySelector('button[aria-label="Open menu"]')
      expect(hamburger).not.toBeNull()
    })

    it('mobile panel is hidden from assistive technology when closed', () => {
      const container = renderNavbar({ logo: 'Acme', links: twoLinks })
      expect(mobilePanel(container)).toHaveAttribute('aria-hidden', 'true')
    })

    it('mobile panel contains all nav links', () => {
      const container = renderNavbar({ logo: 'Acme', links: twoLinks })
      const links = Array.from(mobilePanel(container).querySelectorAll('a'))
      expect(links).toHaveLength(twoLinks.length)
      twoLinks.forEach(({ label, href }, i) => {
        expect(links[i].textContent).toBe(label)
        expect(links[i]).toHaveAttribute('href', href)
      })
    })

    it('mobile panel renders a CTA link when both ctaLabel and ctaAction are provided', () => {
      const container = renderNavbar({ logo: 'Acme', ctaLabel: 'Book now', ctaAction: '/contact' })
      const ctaLink = mobilePanel(container).querySelector('a[href="/contact"]')
      expect(ctaLink).not.toBeNull()
      expect(ctaLink?.textContent).toBe('Book now')
    })

    it('opens external https CTA links in a new tab in the mobile panel', () => {
      const container = renderNavbar({
        logo: 'Acme',
        ctaLabel: 'Ver cómo queda',
        ctaAction: 'https://moviles.clubtal.com',
      })
      const ctaLink = mobilePanel(container).querySelector(
        'a[href="https://moviles.clubtal.com"]',
      )
      expect(ctaLink).not.toBeNull()
      expect(ctaLink).toHaveAttribute('target', '_blank')
      expect(ctaLink).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('mobile panel renders no CTA link when ctaAction is omitted', () => {
      const container = renderNavbar({ logo: 'Acme', ctaLabel: 'Book now' })
      expect(mobilePanel(container).querySelector('a')).toBeNull()
    })

    it('opens the booking modal when ctaAction is #book on desktop', () => {
      const openHandler = vi.fn()
      window.addEventListener(BOOKING_MODAL_OPEN_EVENT, openHandler)

      renderNavbar({ logo: 'Acme', ctaLabel: 'Book Now', ctaAction: '#book' })

      expect(screen.queryByRole('link', { name: 'Book Now' })).not.toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: 'Book Now' }))
      expect(openHandler).toHaveBeenCalledTimes(1)

      window.removeEventListener(BOOKING_MODAL_OPEN_EVENT, openHandler)
    })

    it('opens the mobile panel when the navbar is clicked outside the logo and hamburger', () => {
      const container = renderNavbar({ logo: 'Acme', links: twoLinks })
      fireEvent.click(desktopNav(container))
      expect(mobilePanel(container)).toHaveAttribute('aria-hidden', 'false')
    })

    it('does not open the mobile panel when only the logo is clicked', () => {
      const container = renderNavbar({ logo: 'Acme', links: twoLinks })
      fireEvent.click(screen.getByRole('link', { name: 'Acme' }))
      expect(mobilePanel(container)).toHaveAttribute('aria-hidden', 'true')
    })

    it('closes the mobile panel when the logo link is clicked', () => {
      const container = renderNavbar({ logo: 'Acme', links: twoLinks })

      fireEvent.click(container.querySelector('button[aria-label="Open menu"]')!)
      expect(mobilePanel(container)).toHaveAttribute('aria-hidden', 'false')

      fireEvent.click(screen.getByRole('link', { name: 'Acme' }))
      expect(mobilePanel(container)).toHaveAttribute('aria-hidden', 'true')
    })

    it('opens the booking modal when ctaAction is #book in the mobile panel', () => {
      const openHandler = vi.fn()
      window.addEventListener(BOOKING_MODAL_OPEN_EVENT, openHandler)

      const container = renderNavbar({
        logo: 'Acme',
        ctaLabel: 'Book Now',
        ctaAction: '#book',
      })

      fireEvent.click(container.querySelector('button[aria-label="Open menu"]')!)
      const mobileCta = mobilePanel(container).querySelector('button')
      expect(mobileCta).not.toBeNull()
      fireEvent.click(mobileCta!)
      expect(openHandler).toHaveBeenCalledTimes(1)

      window.removeEventListener(BOOKING_MODAL_OPEN_EVENT, openHandler)
    })
  })
})
