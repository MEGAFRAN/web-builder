import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import FooterBlock from '@/components/blocks/FooterBlock'
import type { FooterColumn } from '@/types/cms'

const columns: FooterColumn[] = [
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Careers', href: '/careers' },
    ],
  },
  {
    title: 'Legal',
    links: [{ label: 'Privacy Policy', href: '/privacy' }],
  },
]

describe('FooterBlock', () => {
  it('renders column titles', () => {
    render(<FooterBlock _type="footer" columns={columns} />)
    expect(screen.getByText('Company')).toBeInTheDocument()
    expect(screen.getByText('Legal')).toBeInTheDocument()
  })

  it('renders all column links with correct hrefs', () => {
    render(<FooterBlock _type="footer" columns={columns} />)
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about')
    expect(screen.getByRole('link', { name: 'Careers' })).toHaveAttribute('href', '/careers')
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy')
  })

  it('renders the copyright notice', () => {
    render(
      <FooterBlock _type="footer" copyright="© 2025 Acme Inc." />
    )
    expect(screen.getByText('© 2025 Acme Inc.')).toBeInTheDocument()
  })

  it('renders without columns when columns prop is null', () => {
    const { container } = render(<FooterBlock _type="footer" columns={null} />)
    const footer = container.querySelector('[data-component="footer"]')
    expect(footer).toBeInTheDocument()
    // No grid of columns should be rendered
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('renders without copyright when copyright prop is null', () => {
    const { container } = render(
      <FooterBlock _type="footer" columns={columns} copyright={null} />
    )
    const footer = container.querySelector('[data-component="footer"]')
    expect(footer).toBeInTheDocument()
    const paragraphs = container.querySelectorAll('p')
    // Only column title paragraphs; none should look like copyright
    paragraphs.forEach((p) => {
      expect(p.textContent).not.toMatch(/©/)
    })
  })

  it('wraps content in a data-component="footer-block" element', () => {
    const { container } = render(<FooterBlock _type="footer" />)
    expect(
      container.querySelector('[data-component="footer-block"]')
    ).toBeInTheDocument()
  })
})
