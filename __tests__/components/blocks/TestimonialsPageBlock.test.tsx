import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { TestimonialsPageTestimonial, TestimonialsPageLogoItem, TestimonialsPageStatItem } from '@/types/cms'

// jsdom does not implement window.matchMedia — StatsBar / LogoCloud may trigger it
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

// Mock getClientConfig to avoid filesystem reads in the test environment
vi.mock('@/lib/client-config', () => ({
  getClientConfig: vi.fn(() => ({
    externalReviewUrl: null,
    externalReviewPlatform: null,
  })),
}))

// Set the CLIENT_ID env var that the component reads at module evaluation time
beforeAll(() => {
  process.env.CLIENT_ID = 'test-client'
})

// Import after mocking
const { default: TestimonialsPageBlock } = await import(
  '@/components/blocks/TestimonialsPageBlock'
)

const featuredTestimonials: TestimonialsPageTestimonial[] = [
  {
    authorName: 'Emma Wilson',
    authorRole: 'Founder',
    authorCompany: 'StartupCo',
    authorPhotoUrl: null,
    quote: 'Absolutely outstanding. Best decision we made.',
    featured: true,
  },
]

const allTestimonials: TestimonialsPageTestimonial[] = [
  {
    authorName: 'James Park',
    authorRole: null,
    authorCompany: 'Park & Partners',
    authorPhotoUrl: null,
    quote: 'Reliable and professional throughout.',
    featured: false,
  },
  {
    authorName: 'Lydia Chen',
    authorRole: 'CTO',
    authorCompany: null,
    authorPhotoUrl: null,
    quote: 'Delivery was spot on every time.',
    featured: false,
  },
]

const logos: TestimonialsPageLogoItem[] = [
  { src: null, alt: 'Acme', name: 'Acme' },
  { src: null, alt: 'Globex', name: 'Globex' },
]

const stats: TestimonialsPageStatItem[] = [
  { value: '200+', label: 'Happy Clients' },
  { value: '4.9', label: 'Avg Rating' },
]

describe('TestimonialsPageBlock', () => {
  it('renders the page header', () => {
    render(
      <TestimonialsPageBlock
        _type="testimonialsPageBlock"
        featuredTestimonials={[]}
        allTestimonials={[]}
      />
    )
    expect(
      screen.getByRole('heading', { name: /what our clients say/i })
    ).toBeInTheDocument()
  })

  it('renders custom stats when provided', () => {
    render(
      <TestimonialsPageBlock
        _type="testimonialsPageBlock"
        stats={stats}
        featuredTestimonials={[]}
        allTestimonials={[]}
      />
    )
    expect(screen.getByText('200+')).toBeInTheDocument()
    expect(screen.getByText('Happy Clients')).toBeInTheDocument()
    expect(screen.getByText('4.9')).toBeInTheDocument()
    expect(screen.getByText('Avg Rating')).toBeInTheDocument()
  })

  it('renders default stats when stats prop is not provided', () => {
    render(
      <TestimonialsPageBlock
        _type="testimonialsPageBlock"
        featuredTestimonials={[]}
        allTestimonials={[]}
      />
    )
    expect(screen.getByText('120+')).toBeInTheDocument()
    expect(screen.getByText('Reviews')).toBeInTheDocument()
  })

  it('renders featured testimonials in a "Featured Reviews" section', () => {
    render(
      <TestimonialsPageBlock
        _type="testimonialsPageBlock"
        featuredTestimonials={featuredTestimonials}
        allTestimonials={[]}
      />
    )
    expect(
      screen.getByRole('heading', { name: 'Featured Reviews' })
    ).toBeInTheDocument()
    // The quote is wrapped in typographic quotes ("…") — use a partial matcher
    expect(
      screen.getByText(/Absolutely outstanding/)
    ).toBeInTheDocument()
    expect(screen.getByText('Emma Wilson')).toBeInTheDocument()
  })

  it('does not render the Featured Reviews section when featuredTestimonials is empty', () => {
    render(
      <TestimonialsPageBlock
        _type="testimonialsPageBlock"
        featuredTestimonials={[]}
        allTestimonials={[]}
      />
    )
    expect(
      screen.queryByRole('heading', { name: 'Featured Reviews' })
    ).not.toBeInTheDocument()
  })

  it('renders extended testimonials in the "More Client Feedback" section', () => {
    render(
      <TestimonialsPageBlock
        _type="testimonialsPageBlock"
        featuredTestimonials={[]}
        allTestimonials={allTestimonials}
      />
    )
    expect(
      screen.getByRole('heading', { name: 'More Client Feedback' })
    ).toBeInTheDocument()
    // Extended quotes are wrapped in regular double quotes ("…") — use partial matchers
    expect(screen.getByText(/Reliable and professional throughout/)).toBeInTheDocument()
    expect(screen.getByText(/Delivery was spot on every time/)).toBeInTheDocument()
  })

  it('renders logo cloud when logoCloudLogos is provided', () => {
    render(
      <TestimonialsPageBlock
        _type="testimonialsPageBlock"
        featuredTestimonials={[]}
        allTestimonials={[]}
        logoCloudLogos={logos}
      />
    )
    expect(screen.getByText('Acme')).toBeInTheDocument()
    expect(screen.getByText('Globex')).toBeInTheDocument()
  })

  it('renders the bottom CTA link to /contact', () => {
    render(
      <TestimonialsPageBlock
        _type="testimonialsPageBlock"
        featuredTestimonials={[]}
        allTestimonials={[]}
      />
    )
    expect(
      screen.getByRole('link', { name: /contact us today/i })
    ).toHaveAttribute('href', '/contact')
  })

  it('renders the external review alert when client config has externalReviewUrl', async () => {
    const { getClientConfig } = await import('@/lib/client-config')
    vi.mocked(getClientConfig).mockReturnValueOnce({
      externalReviewUrl: 'https://g.page/reviews',
      externalReviewPlatform: 'Google',
    } as ReturnType<typeof getClientConfig>)

    render(
      <TestimonialsPageBlock
        _type="testimonialsPageBlock"
        featuredTestimonials={[]}
        allTestimonials={[]}
      />
    )
    expect(screen.getByText(/verified reviews from/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Google' })).toHaveAttribute(
      'href',
      'https://g.page/reviews'
    )
  })
})
