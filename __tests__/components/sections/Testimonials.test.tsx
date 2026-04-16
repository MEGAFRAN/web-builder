import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Testimonials } from '@/components/sections/Testimonials'

// ─── jsdom shims ──────────────────────────────────────────────────────────────

beforeAll(() => {
  if (typeof window.matchMedia !== 'function') {
    vi.stubGlobal(
      'matchMedia',
      (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })
    )
  }
})

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  { quote: 'Incredible service!', author: 'Alice', role: 'CEO', company: 'Acme', avatar: null },
  { quote: 'Best tool we have used.', author: 'Bob', role: 'CTO', company: null, avatar: null },
  { quote: 'Highly recommend.', author: 'Carol', role: null, company: 'TechCo', avatar: '/avatars/carol.jpg' },
]

// ─── Helper ───────────────────────────────────────────────────────────────────

function renderTestimonials(props: React.ComponentProps<typeof Testimonials>) {
  const { container } = render(<Testimonials {...props} />)
  return container
}

function getCarouselSection(container: HTMLElement) {
  return container.querySelector('section[data-component="carousel"]') as HTMLElement
}

function getNextBtn(container: HTMLElement) {
  return container.querySelector('button[aria-label="Next slide"]') as HTMLButtonElement
}

function getPrevBtn(container: HTMLElement) {
  return container.querySelector('button[aria-label="Previous slide"]') as HTMLButtonElement
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Testimonials', () => {
  describe('renders via Carousel', () => {
    it('renders a carousel section', () => {
      const container = renderTestimonials({ testimonials: TESTIMONIALS })
      expect(getCarouselSection(container)).not.toBeNull()
    })

    it('renders all testimonial slides in the DOM', () => {
      const container = renderTestimonials({ testimonials: TESTIMONIALS })
      const slides = container.querySelectorAll('[role="group"][aria-roledescription="slide"]')
      expect(slides).toHaveLength(TESTIMONIALS.length)
    })

    it('renders the first testimonial quote', () => {
      renderTestimonials({ testimonials: TESTIMONIALS })
      expect(screen.getByText('Incredible service!')).toBeInTheDocument()
    })

    it('renders the first testimonial author', () => {
      renderTestimonials({ testimonials: TESTIMONIALS })
      expect(screen.getByText('Alice')).toBeInTheDocument()
    })
  })

  describe('title prop', () => {
    it('renders an <h2> with the title when provided', () => {
      renderTestimonials({ title: 'What people say', testimonials: TESTIMONIALS })
      expect(screen.getByRole('heading', { level: 2, name: 'What people say' })).toBeInTheDocument()
    })

    it('does not render an <h2> when title is omitted', () => {
      const container = renderTestimonials({ testimonials: TESTIMONIALS })
      expect(container.querySelector('h2')).toBeNull()
    })

    it('does not render an <h2> when title={null}', () => {
      const container = renderTestimonials({ title: null, testimonials: TESTIMONIALS })
      expect(container.querySelector('h2')).toBeNull()
    })
  })

  describe('testimonial fields', () => {
    it('renders role when provided on a testimonial', () => {
      renderTestimonials({ testimonials: TESTIMONIALS })
      expect(screen.getByText('CEO')).toBeInTheDocument()
    })

    it('renders company when provided on a testimonial', () => {
      renderTestimonials({ testimonials: TESTIMONIALS })
      expect(screen.getByText('Acme')).toBeInTheDocument()
    })
  })

  describe('arrow navigation integration', () => {
    it('shows next arrow button', () => {
      const container = renderTestimonials({ testimonials: TESTIMONIALS })
      expect(getNextBtn(container)).not.toBeNull()
    })

    it('shows prev arrow button', () => {
      const container = renderTestimonials({ testimonials: TESTIMONIALS })
      expect(getPrevBtn(container)).not.toBeNull()
    })

    it('advances to the second slide when next is clicked', () => {
      const container = renderTestimonials({ testimonials: TESTIMONIALS })
      fireEvent.click(getNextBtn(container))
      const secondSlide = container.querySelector('[aria-label="Slide 2 of 3"]') as HTMLElement
      expect(secondSlide.style.visibility).toBe('visible')
    })
  })

  describe('indicators integration', () => {
    it('renders one indicator per testimonial', () => {
      const container = renderTestimonials({ testimonials: TESTIMONIALS })
      expect(container.querySelectorAll('button[role="tab"]')).toHaveLength(TESTIMONIALS.length)
    })

    it('first indicator is active initially', () => {
      const container = renderTestimonials({ testimonials: TESTIMONIALS })
      const indicators = container.querySelectorAll('button[role="tab"]')
      expect(indicators[0].getAttribute('aria-current')).toBe('true')
    })
  })

  describe('empty testimonials', () => {
    it('renders "No slides configured." when testimonials array is empty', () => {
      renderTestimonials({ testimonials: [] })
      expect(screen.getByText('No slides configured.')).toBeInTheDocument()
    })
  })
})
