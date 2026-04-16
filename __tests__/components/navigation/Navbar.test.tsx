import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Navbar } from '@/components/navigation/Navbar'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const twoLinks = [
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
]

const threeLinks = [
  ...twoLinks,
  { label: 'Blog', href: '/blog' },
]

// ─── Helper ───────────────────────────────────────────────────────────────────

function renderNavbar(props: React.ComponentProps<typeof Navbar>) {
  const { container } = render(<Navbar {...props} />)
  return container
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Navbar', () => {
  describe('root element', () => {
    it('renders a <nav> with data-component="navbar"', () => {
      const container = renderNavbar({ logo: 'Acme' })
      const nav = container.querySelector('nav[data-component="navbar"]')
      expect(nav).not.toBeNull()
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
  })

  describe('links — omitted', () => {
    it('renders no nav links (only the logo link) when links is omitted', () => {
      const container = renderNavbar({ logo: 'Acme' })
      // Only the logo <Link> should produce an <a>
      const anchors = Array.from(container.querySelectorAll('a'))
      expect(anchors).toHaveLength(1)
    })
  })

  describe('links — null', () => {
    it('renders no nav links when links is null', () => {
      const container = renderNavbar({ logo: 'Acme', links: null })
      const anchors = Array.from(container.querySelectorAll('a'))
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
      // total anchors = logo (1) + nav links (3)
      const anchors = Array.from(container.querySelectorAll('a'))
      expect(anchors).toHaveLength(1 + threeLinks.length)
    })

    it('renders links in document order matching the links array', () => {
      const container = renderNavbar({ logo: 'Acme', links: twoLinks })
      const navAnchors = Array.from(container.querySelectorAll('a')).filter(
        (a) => a.getAttribute('href') !== '/'
      )
      navAnchors.forEach((anchor, i) => {
        expect(anchor.textContent).toBe(twoLinks[i].label)
        expect(anchor).toHaveAttribute('href', twoLinks[i].href)
      })
    })
  })

  describe('ctaLabel — omitted', () => {
    it('renders no <button> when ctaLabel is omitted', () => {
      const container = renderNavbar({ logo: 'Acme', links: twoLinks })
      expect(container.querySelector('button')).toBeNull()
    })
  })

  describe('ctaLabel — null', () => {
    it('renders no <button> when ctaLabel is null', () => {
      const container = renderNavbar({ logo: 'Acme', links: twoLinks, ctaLabel: null })
      expect(container.querySelector('button')).toBeNull()
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

  // ctaAction is accepted as a prop but is intentionally unused in the JSX
  // (it is declared in the prop type but never referenced in the render output).
  // No assertion is possible — the prop is a no-op at render time.
  describe('ctaAction prop', () => {
    it('accepts ctaAction without throwing', () => {
      expect(() =>
        renderNavbar({ logo: 'Acme', ctaLabel: 'Go', ctaAction: 'https://example.com' })
      ).not.toThrow()
    })
  })

  describe('fully populated — logo + links + ctaLabel', () => {
    it('renders all parts together without error', () => {
      renderNavbar({ logo: 'Acme', links: twoLinks, ctaLabel: 'Get Started', ctaAction: '/signup' })

      // Logo link
      expect(screen.getByRole('link', { name: 'Acme' })).toHaveAttribute('href', '/')

      // Nav links
      expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about')
      expect(screen.getByRole('link', { name: 'Contact' })).toHaveAttribute('href', '/contact')

      // CTA button
      expect(screen.getByRole('button', { name: 'Get Started' })).toBeInTheDocument()
    })

    it('renders exactly logo + nav links as <a> elements and one <button>', () => {
      const container = renderNavbar({
        logo: 'Acme',
        links: twoLinks,
        ctaLabel: 'Get Started',
      })
      const anchors = Array.from(container.querySelectorAll('a'))
      const buttons = Array.from(container.querySelectorAll('button'))
      expect(anchors).toHaveLength(1 + twoLinks.length)
      expect(buttons).toHaveLength(1)
    })
  })
})
