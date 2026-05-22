import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NavLink } from '@/components/navigation/NavLink'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const BASE_CLASSES = ['text-sm', 'transition-colors']
const ACTIVE_CLASSES = ['font-medium', 'text-foreground']
const INACTIVE_CLASSES = ['text-muted', 'hover:text-primary']

// ─── Helper ───────────────────────────────────────────────────────────────────

function renderNavLink(props: React.ComponentProps<typeof NavLink>) {
  const { container } = render(<NavLink {...props} />)
  return container
}

function getAnchor(container: HTMLElement) {
  return container.querySelector('a[data-component="nav-link"]') as HTMLAnchorElement
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('NavLink', () => {
  describe('root element', () => {
    it('renders an <a> with data-component="nav-link"', () => {
      const container = renderNavLink({ label: 'Home', href: '/' })
      expect(getAnchor(container)).not.toBeNull()
    })
  })

  describe('href', () => {
    it('sets href correctly on the anchor', () => {
      const container = renderNavLink({ label: 'About', href: '/about' })
      expect(getAnchor(container)).toHaveAttribute('href', '/about')
    })
  })

  describe('label', () => {
    it('renders the label text as visible content', () => {
      renderNavLink({ label: 'Contact', href: '/contact' })
      expect(screen.getByText('Contact')).toBeInTheDocument()
    })
  })

  describe('base classes — always present', () => {
    it.each([
      ['active state', { label: 'X', href: '/', active: true }],
      ['inactive state (active=false)', { label: 'X', href: '/', active: false }],
      ['inactive state (active omitted)', { label: 'X', href: '/' }],
      ['inactive state (active=null)', { label: 'X', href: '/', active: null }],
    ] as const)('contains %s base classes text-sm and transition-colors', (_desc, props) => {
      const container = renderNavLink(props)
      const anchor = getAnchor(container)
      BASE_CLASSES.forEach((cls) => expect(anchor.className).toContain(cls))
    })
  })

  describe('active={true}', () => {
    it('className contains font-medium and text-foreground', () => {
      const container = renderNavLink({ label: 'Home', href: '/', active: true })
      const anchor = getAnchor(container)
      ACTIVE_CLASSES.forEach((cls) => expect(anchor.className).toContain(cls))
    })

    it('className does NOT contain text-muted', () => {
      const container = renderNavLink({ label: 'Home', href: '/', active: true })
      expect(getAnchor(container).className).not.toContain('text-muted')
    })
  })

  describe('active={false}', () => {
    it('className contains text-muted and hover:text-primary', () => {
      const container = renderNavLink({ label: 'Home', href: '/', active: false })
      const anchor = getAnchor(container)
      INACTIVE_CLASSES.forEach((cls) => expect(anchor.className).toContain(cls))
    })

    it('className does NOT contain font-medium', () => {
      const container = renderNavLink({ label: 'Home', href: '/', active: false })
      expect(getAnchor(container).className).not.toContain('font-medium')
    })
  })

  describe('active omitted (defaults to undefined/falsy)', () => {
    it('className contains text-muted and hover:text-primary', () => {
      const container = renderNavLink({ label: 'Home', href: '/' })
      const anchor = getAnchor(container)
      INACTIVE_CLASSES.forEach((cls) => expect(anchor.className).toContain(cls))
    })

    it('className does NOT contain font-medium', () => {
      const container = renderNavLink({ label: 'Home', href: '/' })
      expect(getAnchor(container).className).not.toContain('font-medium')
    })
  })

  describe('active={null} (null is falsy)', () => {
    it('className contains text-muted and hover:text-primary', () => {
      const container = renderNavLink({ label: 'Home', href: '/', active: null })
      const anchor = getAnchor(container)
      INACTIVE_CLASSES.forEach((cls) => expect(anchor.className).toContain(cls))
    })

    it('className does NOT contain font-medium', () => {
      const container = renderNavLink({ label: 'Home', href: '/', active: null })
      expect(getAnchor(container).className).not.toContain('font-medium')
    })
  })
})
