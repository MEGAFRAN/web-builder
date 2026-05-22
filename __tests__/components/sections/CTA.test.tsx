import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CTA } from '@/components/sections/CTA'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const BACKGROUND_CASES = [
  ['white', false],
  ['gray',  false],
  ['dark',  true],
] as const

// ─── Helper ───────────────────────────────────────────────────────────────────

function renderCTA(props: React.ComponentProps<typeof CTA>) {
  const { container } = render(<CTA {...props} />)
  return container
}

function getRoot(container: HTMLElement) {
  return container.querySelector('div[data-component="cta"]') as HTMLDivElement
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('CTA', () => {
  describe('root element', () => {
    it('renders a <div> with data-component="cta"', () => {
      const container = renderCTA({ headline: 'Sign up today', ctaLabel: 'Get started' })
      expect(getRoot(container)).not.toBeNull()
    })
  })

  describe('headline prop', () => {
    it('renders an <h2> with the headline text', () => {
      renderCTA({ headline: 'Join us now', ctaLabel: 'Go' })
      expect(screen.getByRole('heading', { level: 2, name: 'Join us now' })).toBeInTheDocument()
    })
  })

  describe('subtext prop', () => {
    it('renders a <p> with subtext when subtext is provided', () => {
      renderCTA({ headline: 'H', ctaLabel: 'Go', subtext: 'No credit card required' })
      expect(screen.getByText('No credit card required').tagName).toBe('P')
    })

    it('does not render a <p> when subtext is omitted', () => {
      const container = renderCTA({ headline: 'H', ctaLabel: 'Go' })
      expect(container.querySelector('p')).toBeNull()
    })

    it('does not render a <p> when subtext={null}', () => {
      const container = renderCTA({ headline: 'H', ctaLabel: 'Go', subtext: null })
      expect(container.querySelector('p')).toBeNull()
    })
  })

  describe('ctaLabel prop', () => {
    it('renders a button with the ctaLabel text', () => {
      renderCTA({ headline: 'H', ctaLabel: 'Subscribe' })
      expect(screen.getByRole('button', { name: 'Subscribe' })).toBeInTheDocument()
    })
  })

  describe('background prop', () => {
    it.each(BACKGROUND_CASES)(
      'background="%s" renders with isDark=%s styling on headline',
      (background, isDark) => {
        renderCTA({ headline: 'H', ctaLabel: 'Go', background })
        const heading = screen.getByRole('heading', { level: 2 })
        if (isDark) {
          expect(heading.className).toContain('text-primary-fg')
        } else {
          expect(heading.className).toContain('text-brand')
        }
      }
    )

    it('defaults to gray background when background is omitted', () => {
      renderCTA({ headline: 'H', ctaLabel: 'Go' })
      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading.className).toContain('text-brand')
    })

    it('defaults to gray background when background={null}', () => {
      renderCTA({ headline: 'H', ctaLabel: 'Go', background: null })
      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading.className).toContain('text-brand')
    })

    it('applies dark-mode button class when background="dark"', () => {
      const container = renderCTA({ headline: 'H', ctaLabel: 'Go', background: 'dark' })
      const btn = container.querySelector('button')
      expect(btn?.className).toContain('bg-background')
    })

    it('applies primary button class when background="white"', () => {
      const container = renderCTA({ headline: 'H', ctaLabel: 'Go', background: 'white' })
      const btn = container.querySelector('button')
      expect(btn?.className).toContain('bg-primary')
    })

    it('applies muted subtext class when background="dark" and subtext is provided', () => {
      renderCTA({ headline: 'H', ctaLabel: 'Go', subtext: 'Sub', background: 'dark' })
      const p = screen.getByText('Sub')
      expect(p.className).toContain('text-primary-fg-muted')
    })

    it('applies regular muted class when background="gray" and subtext is provided', () => {
      renderCTA({ headline: 'H', ctaLabel: 'Go', subtext: 'Sub', background: 'gray' })
      const p = screen.getByText('Sub')
      expect(p.className).toContain('text-muted')
    })
  })

  describe('combined props', () => {
    it('renders headline, subtext, and button together', () => {
      renderCTA({ headline: 'Ready?', subtext: 'Start today', ctaLabel: 'Sign up' })
      expect(screen.getByRole('heading', { level: 2, name: 'Ready?' })).toBeInTheDocument()
      expect(screen.getByText('Start today')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Sign up' })).toBeInTheDocument()
    })
  })
})
