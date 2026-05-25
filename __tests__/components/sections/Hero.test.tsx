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
