import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import HomepageHeroBlock from '@/components/blocks/HomepageHeroBlock'

describe('HomepageHeroBlock', () => {
  it('renders the heading as an h1', () => {
    render(
      <HomepageHeroBlock
        _type="heroBlock"
        heading="Build Better Products"
      />
    )
    expect(
      screen.getByRole('heading', { level: 1, name: 'Build Better Products' })
    ).toBeInTheDocument()
  })

  it('renders subtext when provided', () => {
    render(
      <HomepageHeroBlock
        _type="heroBlock"
        heading="Build Better Products"
        subtext="From idea to launch, we've got you covered."
      />
    )
    expect(
      screen.getByText("From idea to launch, we've got you covered.")
    ).toBeInTheDocument()
  })

  it('renders the primary CTA button when primaryButtonLabel is provided', () => {
    render(
      <HomepageHeroBlock
        _type="heroBlock"
        heading="Hello"
        primaryButtonLabel="Get Started"
      />
    )
    expect(screen.getByRole('button', { name: 'Get Started' })).toBeInTheDocument()
  })

  it('passes primaryButtonHref to the hero CTA as a link', () => {
    render(
      <HomepageHeroBlock
        _type="heroBlock"
        heading="Hello"
        primaryButtonLabel="View Services"
        primaryButtonHref="#services"
      />,
    )
    expect(screen.getByRole('link', { name: 'View Services' })).toHaveAttribute('href', '#services')
  })

  it('renders no buttons when primaryButtonLabel is omitted', () => {
    render(<HomepageHeroBlock _type="heroBlock" heading="Hello" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('wraps content in a data-component="homepage-hero-block" element', () => {
    const { container } = render(
      <HomepageHeroBlock _type="heroBlock" heading="Hello" />
    )
    expect(
      container.querySelector('[data-component="homepage-hero-block"]')
    ).toBeInTheDocument()
  })

  it('renders a background image when backgroundImageUrl is provided', () => {
    const { container } = render(
      <HomepageHeroBlock
        _type="heroBlock"
        heading="Hello"
        backgroundImageUrl="https://example.com/hero.jpg"
      />
    )
    const img = container.querySelector('img[data-component="image"]') as HTMLImageElement
    expect(img).not.toBeNull()
    expect(img.src).toContain('https://example.com/hero.jpg')
  })

  it('uses gradient fallback when no background image is configured', () => {
    const { container } = render(
      <HomepageHeroBlock _type="heroBlock" heading="Hello" />
    )
    expect(container.querySelector('[data-component="section"]')?.className).toContain(
      'hero-bg-gradient'
    )
    expect(
      container.querySelector('[data-component="hero"]')?.getAttribute('data-hero-bg')
    ).toBe('gradient')
  })

  it('fills the first viewport on mobile and desktop', () => {
    const { container } = render(
      <HomepageHeroBlock _type="heroBlock" heading="Hello" />
    )
    const sectionClass = container.querySelector('[data-component="section"]')?.className
    expect(sectionClass).toContain('max-md:min-h-[calc(100svh-7rem)]')
    expect(sectionClass).toContain('md:min-h-[calc(100dvh-4.5rem)]')
  })
})
