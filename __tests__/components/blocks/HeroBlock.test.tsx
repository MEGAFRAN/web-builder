import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import HeroBlock from '@/components/blocks/HeroBlock'

describe('HeroBlock', () => {
  it('renders title and subtitle', () => {
    render(<HeroBlock _type="hero" title="Welcome to Pepe" subtitle="Best food in town" />)
    expect(screen.getByRole('heading', { name: 'Welcome to Pepe' })).toBeInTheDocument()
    expect(screen.getByText('Best food in town')).toBeInTheDocument()
  })

  it('renders CTA button when cta prop is provided', () => {
    render(
      <HeroBlock
        _type="hero"
        title="Hello"
        cta={{ label: 'Book a table', href: '/booking' }}
      />
    )
    const link = screen.getByRole('link', { name: 'Book a table' })
    expect(link).toHaveAttribute('href', '/booking')
  })

  it('does not render a link when no cta', () => {
    render(<HeroBlock _type="hero" title="Hello" />)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('does not render subtitle when not provided', () => {
    render(<HeroBlock _type="hero" title="Hello" />)
    expect(screen.queryByTestId('hero-subtitle')).not.toBeInTheDocument()
  })
})
