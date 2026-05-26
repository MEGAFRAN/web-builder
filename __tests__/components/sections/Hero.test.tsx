import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Hero } from '@/components/sections/Hero'
import { BOOKING_MODAL_OPEN_EVENT } from '@/lib/booking-modal-events'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const ALIGN_CASES = [
  ['center', 'items-center', 'text-center'],
  ['left',   'items-start',  'text-left'],
] as const

// ─── Helper ───────────────────────────────────────────────────────────────────

function renderHero(props: React.ComponentProps<typeof Hero>) {
  const { container } = render(<Hero {...props} />)
  return container
}

function getRoot(container: HTMLElement) {
  return container.querySelector('div[data-component="hero"]') as HTMLDivElement
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Hero', () => {
  describe('root element', () => {
    it('renders a <div> with data-component="hero"', () => {
      const container = renderHero({ headline: 'Hello' })
      expect(getRoot(container)).not.toBeNull()
    })
  })

  describe('headline prop', () => {
    it('renders an <h1> with the headline text', () => {
      renderHero({ headline: 'Welcome to our site' })
      expect(screen.getByRole('heading', { level: 1, name: 'Welcome to our site' })).toBeInTheDocument()
    })
  })

  describe('subtext prop', () => {
    it('renders a <p> with subtext when subtext is provided', () => {
      renderHero({ headline: 'H', subtext: 'Great product' })
      expect(screen.getByText('Great product').tagName).toBe('P')
    })

    it('does not render a subtext <p> when subtext is omitted', () => {
      const container = renderHero({ headline: 'H' })
      expect(container.querySelector('p')).toBeNull()
    })

    it('does not render a subtext <p> when subtext={null}', () => {
      const container = renderHero({ headline: 'H', subtext: null })
      expect(container.querySelector('p')).toBeNull()
    })
  })

  describe('ctaLabel prop', () => {
    it('renders a primary CTA button when ctaLabel is provided', () => {
      renderHero({ headline: 'H', ctaLabel: 'Get Started' })
      expect(screen.getByRole('button', { name: 'Get Started' })).toBeInTheDocument()
    })

    it('applies primary button classes to the CTA button', () => {
      const container = renderHero({ headline: 'H', ctaLabel: 'Start' })
      const btn = container.querySelector('button')
      expect(btn?.className).toContain('bg-primary')
    })

    it('renders a link when ctaAction is a normal href', () => {
      renderHero({ headline: 'H', ctaLabel: 'View Services', ctaAction: '#services' })
      const link = screen.getByRole('link', { name: 'View Services' })
      expect(link).toHaveAttribute('href', '#services')
    })

    it('opens the booking modal when ctaAction is #book', () => {
      const openHandler = vi.fn()
      window.addEventListener(BOOKING_MODAL_OPEN_EVENT, openHandler)

      renderHero({ headline: 'H', ctaLabel: 'Book Now', ctaAction: '#book' })
      fireEvent.click(screen.getByRole('button', { name: 'Book Now' }))
      expect(openHandler).toHaveBeenCalledTimes(1)

      window.removeEventListener(BOOKING_MODAL_OPEN_EVENT, openHandler)
    })

    it('does not render a CTA button when ctaLabel is omitted', () => {
      const container = renderHero({ headline: 'H' })
      expect(container.querySelector('button')).toBeNull()
    })

    it('does not render a CTA button when ctaLabel={null}', () => {
      const container = renderHero({ headline: 'H', ctaLabel: null })
      expect(container.querySelector('button')).toBeNull()
    })
  })

  describe('align prop', () => {
    it.each(ALIGN_CASES)('align="%s" applies "%s" and "%s" classes', (align, itemsClass, textClass) => {
      const container = renderHero({ headline: 'H', align })
      const root = getRoot(container)
      expect(root.className).toContain(itemsClass)
      expect(root.className).toContain(textClass)
    })

    it('defaults to center alignment when align is omitted', () => {
      const container = renderHero({ headline: 'H' })
      const root = getRoot(container)
      expect(root.className).toContain('items-center')
      expect(root.className).toContain('text-center')
    })

    it('defaults to center alignment when align={null}', () => {
      const container = renderHero({ headline: 'H', align: null })
      const root = getRoot(container)
      expect(root.className).toContain('items-center')
      expect(root.className).toContain('text-center')
    })
  })

  describe('fullViewportHeightMobile prop', () => {
    it('applies mobile full-viewport classes to the section when enabled', () => {
      const container = renderHero({ headline: 'H', fullViewportHeightMobile: true })
      const section = container.querySelector('[data-component="section"]')
      expect(section?.className).toContain('max-md:min-h-[calc(100dvh-7rem)]')
      expect(section?.className).toContain('max-md:flex')
      expect(section?.className).toContain('max-md:justify-center')
    })

    it('does not apply mobile full-viewport classes by default', () => {
      const container = renderHero({ headline: 'H' })
      const section = container.querySelector('[data-component="section"]')
      expect(section?.className).not.toContain('max-md:min-h-[calc(100dvh-7rem)]')
    })
  })

  describe('backgroundImageUrl prop', () => {
    it('renders a high-priority fill image and overlay when provided', () => {
      const container = renderHero({
        headline: 'H',
        backgroundImageUrl: 'https://example.com/hero.jpg',
      })
      const img = container.querySelector('img[data-component="image"]') as HTMLImageElement
      expect(img).not.toBeNull()
      expect(img.src).toContain('https://example.com/hero.jpg')
      expect(img.getAttribute('fetchpriority')).toBe('high')
      expect(img.getAttribute('loading')).toBe('eager')
      expect(container.querySelector('[data-component="hero-photo-overlay"]')).not.toBeNull()
    })

    it('uses light text styles on photo backgrounds', () => {
      renderHero({
        headline: 'Salon',
        subtext: 'Welcome',
        backgroundImageUrl: 'https://example.com/hero.jpg',
      })
      const heading = screen.getByRole('heading', { level: 1, name: 'Salon' })
      const subtext = screen.getByText('Welcome')
      expect(heading.className).toContain('text-white')
      expect(subtext.className).toContain('text-white')
      expect(subtext.className).not.toContain('text-primary-fg-muted')
    })

    it('adds a dark content panel behind text on photo backgrounds', () => {
      const container = renderHero({
        headline: 'H',
        backgroundImageUrl: 'https://example.com/hero.jpg',
      })
      expect(getRoot(container).className).toContain('hero-photo-content-panel')
    })

    it('marks the hero as photo mode', () => {
      const container = renderHero({
        headline: 'H',
        backgroundImageUrl: 'https://example.com/hero.jpg',
      })
      expect(getRoot(container).getAttribute('data-hero-bg')).toBe('photo')
    })

    it('opts the section out of alternating background overrides', () => {
      const container = renderHero({
        headline: 'H',
        backgroundImageUrl: 'https://example.com/hero.jpg',
      })
      expect(
        container.querySelector('[data-component="section"]')?.getAttribute('data-visual-bg')
      ).toBe('true')
    })
  })

  describe('gradientFallback prop', () => {
    it('applies the gradient class when enabled without a photo', () => {
      const container = renderHero({ headline: 'H', gradientFallback: true })
      const section = container.querySelector('[data-component="section"]')
      expect(section?.className).toContain('hero-bg-gradient')
      expect(getRoot(container).getAttribute('data-hero-bg')).toBe('gradient')
    })

    it('keeps default text styles on gradient fallback', () => {
      renderHero({ headline: 'Salon', subtext: 'Welcome', gradientFallback: true })
      const heading = screen.getByRole('heading', { level: 1, name: 'Salon' })
      const subtext = screen.getByText('Welcome')
      expect(heading.className).toContain('text-brand')
      expect(subtext.className).toContain('text-muted')
    })

    it('does not add a content panel on gradient fallback', () => {
      const container = renderHero({ headline: 'H', gradientFallback: true })
      expect(getRoot(container).className).not.toContain('hero-photo-content-panel')
    })

    it('prefers photo mode over gradient fallback when both are available', () => {
      const container = renderHero({
        headline: 'H',
        gradientFallback: true,
        backgroundImageUrl: 'https://example.com/hero.jpg',
      })
      const section = container.querySelector('[data-component="section"]')
      expect(section?.className).not.toContain('hero-bg-gradient')
      expect(getRoot(container).getAttribute('data-hero-bg')).toBe('photo')
    })
  })

  describe('combined props', () => {
    it('renders headline, subtext, and CTA together', () => {
      renderHero({
        headline: 'Big Headline',
        subtext: 'Some subtext',
        ctaLabel: 'Start',
      })
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
      expect(screen.getByText('Some subtext')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument()
    })
  })
})
