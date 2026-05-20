import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import NavbarBlock from '@/components/blocks/NavbarBlock'
import type { NavLink } from '@/types/cms'

const links: NavLink[] = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
]

describe('NavbarBlock', () => {
  it('renders the logo text', () => {
    render(<NavbarBlock _type="navbar" logo="Acme Co" />)
    expect(screen.getByText('Acme Co')).toBeInTheDocument()
  })

  it('renders navigation links', () => {
    render(<NavbarBlock _type="navbar" logo="Acme Co" links={links} />)
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about')
    expect(screen.getByRole('link', { name: 'Contact' })).toHaveAttribute('href', '/contact')
  })

  it('renders the CTA button when ctaLabel is provided', () => {
    render(
      <NavbarBlock _type="navbar" logo="Acme Co" ctaLabel="Get a Quote" />
    )
    expect(screen.getByRole('button', { name: 'Get a Quote' })).toBeInTheDocument()
  })

  it('does not render a CTA button when ctaLabel is omitted', () => {
    const { container } = render(<NavbarBlock _type="navbar" logo="Acme Co" links={links} />)
    // Hamburger always renders (has aria-label); check no CTA button (no aria-label) is present
    expect(container.querySelector('button:not([aria-label])')).toBeNull()
  })

  it('renders the nav landmark', () => {
    render(<NavbarBlock _type="navbar" logo="Acme Co" />)
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('wraps content in a data-component="navbar-block" element', () => {
    const { container } = render(<NavbarBlock _type="navbar" logo="Acme Co" />)
    expect(
      container.querySelector('[data-component="navbar-block"]')
    ).toBeInTheDocument()
  })
})
