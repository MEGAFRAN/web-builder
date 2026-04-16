import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import PricingPageBlock from '@/components/blocks/PricingPageBlock'

// jsdom does not implement window.matchMedia — Carousel (used by Testimonials) uses it
beforeAll(() => {
  if (typeof window.matchMedia !== 'function') {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  }
})
import type { PricingTierItem, PricingTestimonialItem } from '@/types/cms'

const tiers: PricingTierItem[] = [
  {
    name: 'Starter',
    price: 0,
    billingCadence: '/month',
    features: ['5 projects', '10 GB storage'],
    recommended: false,
    ctaLabel: 'Start Free',
    ctaHref: '/signup?plan=starter',
  },
  {
    name: 'Pro',
    price: 49,
    billingCadence: '/month',
    features: ['Unlimited projects', '100 GB storage', 'Priority support'],
    recommended: true,
    ctaLabel: 'Go Pro',
    ctaHref: '/signup?plan=pro',
  },
]

const testimonials: PricingTestimonialItem[] = [
  { name: 'Alice', quote: 'Great value!', role: 'CEO', company: 'Acme' },
]

describe('PricingPageBlock', () => {
  it('renders the page heading', () => {
    render(
      <PricingPageBlock
        _type="pricingPageBlock"
        tiers={tiers}
        testimonials={[]}
        faqItems={[]}
      />
    )
    expect(
      screen.getByRole('heading', { name: /simple, transparent pricing/i })
    ).toBeInTheDocument()
  })

  it('renders each pricing tier name', () => {
    render(
      <PricingPageBlock
        _type="pricingPageBlock"
        tiers={tiers}
        testimonials={[]}
        faqItems={[]}
      />
    )
    expect(screen.getByText('Starter')).toBeInTheDocument()
    expect(screen.getByText('Pro')).toBeInTheDocument()
  })

  it('renders CTA labels for each tier', () => {
    render(
      <PricingPageBlock
        _type="pricingPageBlock"
        tiers={tiers}
        testimonials={[]}
        faqItems={[]}
      />
    )
    // PricingTable renders tier CTAs as <button> elements, not links
    expect(screen.getByRole('button', { name: 'Start Free' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Go Pro' })).toBeInTheDocument()
  })

  it('shows the promotion banner when expiresAt is in the future', () => {
    const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString()
    render(
      <PricingPageBlock
        _type="pricingPageBlock"
        tiers={tiers}
        promotionBanner={{ message: 'Limited time offer: 20% off!', expiresAt: futureDate }}
        testimonials={[]}
        faqItems={[]}
      />
    )
    expect(screen.getByText('Limited time offer: 20% off!')).toBeInTheDocument()
  })

  it('hides the promotion banner when expiresAt is in the past', () => {
    const pastDate = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
    render(
      <PricingPageBlock
        _type="pricingPageBlock"
        tiers={tiers}
        promotionBanner={{ message: 'Expired offer', expiresAt: pastDate }}
        testimonials={[]}
        faqItems={[]}
      />
    )
    expect(screen.queryByText('Expired offer')).not.toBeInTheDocument()
  })

  it('renders testimonials when provided', () => {
    const { container } = render(
      <PricingPageBlock
        _type="pricingPageBlock"
        tiers={tiers}
        testimonials={testimonials}
        faqItems={[]}
      />
    )
    // Testimonials are rendered via Carousel — the quote is in the DOM even if slide is hidden
    expect(screen.getByText('Great value!')).toBeInTheDocument()
    // The author name is rendered in a slide group
    const slides = container.querySelectorAll('[role="group"][aria-roledescription="slide"]')
    expect(slides.length).toBeGreaterThan(0)
  })

  it('does not render testimonials section when testimonials array is empty', () => {
    render(
      <PricingPageBlock
        _type="pricingPageBlock"
        tiers={tiers}
        testimonials={[]}
        faqItems={[]}
      />
    )
    // The testimonial section heading "What clients say about the value" should not appear
    expect(
      screen.queryByText(/what clients say about the value/i)
    ).not.toBeInTheDocument()
  })

  it('renders default FAQ items when faqItems is empty', () => {
    render(
      <PricingPageBlock
        _type="pricingPageBlock"
        tiers={tiers}
        testimonials={[]}
        faqItems={[]}
      />
    )
    expect(
      screen.getByText('What is included in each plan?')
    ).toBeInTheDocument()
  })

  it('renders custom FAQ items when faqItems is provided', () => {
    render(
      <PricingPageBlock
        _type="pricingPageBlock"
        tiers={tiers}
        testimonials={[]}
        faqItems={[{ question: 'Custom question?', answer: 'Custom answer.' }]}
      />
    )
    expect(screen.getByText('Custom question?')).toBeInTheDocument()
  })

  it('renders the breadcrumb with Home and Pricing links', () => {
    render(
      <PricingPageBlock
        _type="pricingPageBlock"
        tiers={tiers}
        testimonials={[]}
        faqItems={[]}
      />
    )
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
    expect(screen.getByText('Pricing')).toBeInTheDocument()
  })

  it('renders bottom CTA links', () => {
    render(
      <PricingPageBlock
        _type="pricingPageBlock"
        tiers={tiers}
        testimonials={[]}
        faqItems={[]}
      />
    )
    expect(screen.getByRole('link', { name: 'Talk to Sales' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Start Free Trial' })).toBeInTheDocument()
  })
})
