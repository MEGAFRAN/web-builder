import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import BreadcrumbBlock from '@/components/blocks/BreadcrumbBlock'

describe('BreadcrumbBlock', () => {
  it('renders a nav landmark', () => {
    render(
      <BreadcrumbBlock
        _type="breadcrumb"
        items={[{ label: 'Home', href: '/' }, { label: 'About' }]}
      />
    )
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('renders each breadcrumb label', () => {
    render(
      <BreadcrumbBlock
        _type="breadcrumb"
        items={[
          { label: 'Home', href: '/' },
          { label: 'Services', href: '/services' },
          { label: 'Web Design' },
        ]}
      />
    )
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Services')).toBeInTheDocument()
    expect(screen.getByText('Web Design')).toBeInTheDocument()
  })

  it('renders items with href as anchor links and items without href as plain text', () => {
    render(
      <BreadcrumbBlock
        _type="breadcrumb"
        items={[
          { label: 'Home', href: '/' },
          { label: 'Current Page' },
        ]}
      />
    )
    const link = screen.getByRole('link', { name: 'Home' })
    expect(link).toHaveAttribute('href', '/')
    // Current Page has no href → rendered as a span, not a link
    expect(screen.queryByRole('link', { name: 'Current Page' })).not.toBeInTheDocument()
    expect(screen.getByText('Current Page')).toBeInTheDocument()
  })

  it('renders an empty nav for an empty items array', () => {
    render(<BreadcrumbBlock _type="breadcrumb" items={[]} />)
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })
})
