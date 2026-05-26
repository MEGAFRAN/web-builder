import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PricingTable } from '@/components/sections/PricingTable'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const TIER_BASIC = {
  name: 'Starter',
  price: '$9',
  period: '/mo',
  description: 'Perfect for individuals',
  features: ['1 user', '5 projects', 'Basic support'],
  ctaLabel: 'Get Starter',
  highlighted: false,
}

const TIER_PRO = {
  name: 'Pro',
  price: '$29',
  period: '/mo',
  description: 'For growing teams',
  features: ['10 users', 'Unlimited projects', 'Priority support'],
  ctaLabel: 'Get Pro',
  highlighted: true,
}

const TIER_ENTERPRISE = {
  name: 'Enterprise',
  price: '$99',
  period: '/mo',
  features: ['Unlimited users', 'Custom integrations', '24/7 support'],
  ctaLabel: 'Contact Sales',
  highlighted: false,
}

const TWO_TIERS = [TIER_BASIC, TIER_PRO]
const THREE_TIERS = [TIER_BASIC, TIER_PRO, TIER_ENTERPRISE]

// ─── Helper ───────────────────────────────────────────────────────────────────

function renderPricingTable(props: React.ComponentProps<typeof PricingTable>) {
  const { container } = render(<PricingTable {...props} />)
  return container
}

function getRoot(container: HTMLElement) {
  return container.querySelector('div[data-component="pricing-table"]') as HTMLDivElement
}

function getGrid(container: HTMLElement) {
  return getRoot(container).querySelector('.grid') as HTMLDivElement
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PricingTable', () => {
  describe('root element', () => {
    it('renders a <div> with data-component="pricing-table"', () => {
      const container = renderPricingTable({ tiers: TWO_TIERS })
      expect(getRoot(container)).not.toBeNull()
    })
  })

  describe('title prop', () => {
    it('renders an <h2> when title is provided', () => {
      renderPricingTable({ title: 'Simple Pricing', tiers: TWO_TIERS })
      expect(screen.getByRole('heading', { level: 2, name: 'Simple Pricing' })).toBeInTheDocument()
    })

    it('does not render an <h2> when title is omitted', () => {
      const container = renderPricingTable({ tiers: TWO_TIERS })
      expect(container.querySelector('h2')).toBeNull()
    })

    it('does not render an <h2> when title={null}', () => {
      const container = renderPricingTable({ title: null, tiers: TWO_TIERS })
      expect(container.querySelector('h2')).toBeNull()
    })
  })

  describe('subtitle prop', () => {
    it('renders a <p> with subtitle text when provided', () => {
      renderPricingTable({ subtitle: 'No hidden fees', tiers: TWO_TIERS })
      expect(screen.getByText('No hidden fees').tagName).toBe('P')
    })

    it('does not render subtitle when omitted', () => {
      const container = renderPricingTable({ tiers: TWO_TIERS })
      expect(container.querySelector('p.mb-12')).toBeNull()
    })

    it('does not render subtitle when subtitle={null}', () => {
      const container = renderPricingTable({ subtitle: null, tiers: TWO_TIERS })
      expect(container.querySelector('p.mb-12')).toBeNull()
    })
  })

  describe('tiers rendering', () => {
    it('renders an <h3> for each tier name', () => {
      renderPricingTable({ tiers: THREE_TIERS })
      THREE_TIERS.forEach(({ name }) => {
        expect(screen.getByRole('heading', { level: 3, name })).toBeInTheDocument()
      })
    })

    it('renders the price for each tier', () => {
      renderPricingTable({ tiers: THREE_TIERS })
      expect(screen.getByText('$9')).toBeInTheDocument()
      expect(screen.getByText('$29')).toBeInTheDocument()
      expect(screen.getByText('$99')).toBeInTheDocument()
    })

    it('renders the period for tiers that have it', () => {
      renderPricingTable({ tiers: THREE_TIERS })
      const periods = screen.getAllByText('/mo')
      expect(periods.length).toBeGreaterThanOrEqual(2)
    })

    it('renders tier descriptions when provided', () => {
      renderPricingTable({ tiers: TWO_TIERS })
      expect(screen.getByText('Perfect for individuals')).toBeInTheDocument()
      expect(screen.getByText('For growing teams')).toBeInTheDocument()
    })

    it('does not render description for a tier without one', () => {
      renderPricingTable({ tiers: [TIER_ENTERPRISE] })
      expect(screen.queryByText('Perfect for individuals')).not.toBeInTheDocument()
    })

    it('renders all feature list items for each tier', () => {
      renderPricingTable({ tiers: [TIER_BASIC] })
      TIER_BASIC.features.forEach((feature) => {
        expect(screen.getByText(feature)).toBeInTheDocument()
      })
    })

    it('renders a CTA button for each tier', () => {
      renderPricingTable({ tiers: THREE_TIERS })
      THREE_TIERS.forEach(({ ctaLabel }) => {
        expect(screen.getByRole('button', { name: ctaLabel })).toBeInTheDocument()
      })
    })
  })

  describe('highlighted tier', () => {
    it('renders "Recommended" badge for highlighted tiers', () => {
      renderPricingTable({ tiers: TWO_TIERS })
      expect(screen.getByText('Recommended')).toBeInTheDocument()
    })

    it('does not render "Recommended" badge for non-highlighted tiers', () => {
      renderPricingTable({ tiers: [TIER_BASIC] })
      expect(screen.queryByText('Recommended')).not.toBeInTheDocument()
    })

    it('applies border-primary class to highlighted tier card', () => {
      const container = renderPricingTable({ tiers: TWO_TIERS })
      const tierCards = container.querySelectorAll('.rounded-xl')
      const highlighted = Array.from(tierCards).find((el) =>
        el.className.includes('border-primary')
      )
      expect(highlighted).not.toBeUndefined()
    })

    it('applies bg-primary to the CTA button of a highlighted tier', () => {
      const container = renderPricingTable({ tiers: TWO_TIERS })
      const buttons = container.querySelectorAll('button')
      const highlightedBtn = Array.from(buttons).find(
        (btn) => btn.textContent === 'Get Pro'
      )
      expect(highlightedBtn?.className).toContain('bg-primary')
    })

    it('applies border-border to the CTA button of a non-highlighted tier', () => {
      renderPricingTable({ tiers: [TIER_BASIC] })
      const btn = screen.getByRole('button', { name: 'Get Starter' })
      expect(btn.className).toContain('border-border')
    })
  })

  describe('grid layout', () => {
    it('uses 2-column grid for exactly 2 tiers', () => {
      const container = renderPricingTable({ tiers: TWO_TIERS })
      expect(getGrid(container).className).toContain('sm:grid-cols-2')
    })

    it('uses 3-column grid for 3 tiers', () => {
      const container = renderPricingTable({ tiers: THREE_TIERS })
      expect(getGrid(container).className).toContain('sm:grid-cols-3')
    })
  })

  describe('onPress interaction', () => {
    it('calls onPress when a tier CTA button is clicked', () => {
      const handler = vi.fn()
      renderPricingTable({ tiers: TWO_TIERS, onPress: handler })
      fireEvent.click(screen.getByRole('button', { name: 'Get Starter' }))
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('calls onPress for each tier button independently', () => {
      const handler = vi.fn()
      renderPricingTable({ tiers: TWO_TIERS, onPress: handler })
      fireEvent.click(screen.getByRole('button', { name: 'Get Starter' }))
      fireEvent.click(screen.getByRole('button', { name: 'Get Pro' }))
      expect(handler).toHaveBeenCalledTimes(2)
    })

    it('does not throw when onPress is omitted and a button is clicked', () => {
      renderPricingTable({ tiers: [TIER_BASIC] })
      expect(() => fireEvent.click(screen.getByRole('button', { name: 'Get Starter' }))).not.toThrow()
    })
  })

  describe('combined props', () => {
    it('renders title, subtitle, and all tiers together', () => {
      renderPricingTable({ title: 'Pricing', subtitle: 'Pick a plan', tiers: THREE_TIERS })
      expect(screen.getByRole('heading', { level: 2, name: 'Pricing' })).toBeInTheDocument()
      expect(screen.getByText('Pick a plan')).toBeInTheDocument()
      expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(THREE_TIERS.length)
    })
  })
})
