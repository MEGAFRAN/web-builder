import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import TestimonialsBlock from '@/components/blocks/TestimonialsBlock'
import type { TestimonialItem } from '@/types/cms'

// jsdom does not implement window.matchMedia — Carousel uses it for prefers-reduced-motion
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

const items: TestimonialItem[] = [
  {
    name: 'Sarah Jones',
    quote: 'Transformed our business completely.',
    role: 'COO',
    company: 'TechCorp',
    avatarUrl: null,
    stars: 5,
  },
  {
    name: 'Marcus Lee',
    quote: 'Exceptional service from start to finish.',
    role: null,
    company: null,
    avatarUrl: null,
  },
]

describe('TestimonialsBlock', () => {
  it('renders the first testimonial quote (active slide)', () => {
    render(<TestimonialsBlock _type="testimonialsBlock" items={items} />)
    // Carousel shows the first slide as the active one
    expect(
      screen.getByText('Transformed our business completely.')
    ).toBeInTheDocument()
  })

  it('renders the first author name', () => {
    render(<TestimonialsBlock _type="testimonialsBlock" items={items} />)
    expect(screen.getByText('Sarah Jones')).toBeInTheDocument()
  })

  it('renders all slides in the DOM (including hidden ones)', () => {
    const { container } = render(
      <TestimonialsBlock _type="testimonialsBlock" items={items} />
    )
    // All slides are rendered in the DOM even when hidden for accessibility
    const slides = container.querySelectorAll('[role="group"][aria-roledescription="slide"]')
    expect(slides).toHaveLength(items.length)
  })

  it('renders the optional section heading', () => {
    render(
      <TestimonialsBlock
        _type="testimonialsBlock"
        heading="What Our Clients Say"
        items={items}
      />
    )
    expect(
      screen.getByRole('heading', { name: 'What Our Clients Say' })
    ).toBeInTheDocument()
  })

  it('renders star rating when stars is set on an item', () => {
    render(<TestimonialsBlock _type="testimonialsBlock" items={items} />)
    expect(screen.getByRole('img', { name: '5 stars' })).toBeInTheDocument()
  })

  it('wraps content in a data-component="testimonials-block" element', () => {
    const { container } = render(
      <TestimonialsBlock _type="testimonialsBlock" items={items} />
    )
    expect(
      container.querySelector('[data-component="testimonials-block"]')
    ).toBeInTheDocument()
  })
})
