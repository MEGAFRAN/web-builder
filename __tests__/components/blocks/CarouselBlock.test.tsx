import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CarouselBlock from '@/components/blocks/CarouselBlock'
import type { CarouselItem } from '@/types/cms'

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

const testimonialItems: CarouselItem[] = [
  { quote: 'Amazing service!', author: 'Alice', role: 'CEO' },
  { quote: 'Highly recommended.', author: 'Bob', role: 'CTO' },
  { quote: 'Great experience.', author: 'Carol', role: 'Designer' },
]

const cardItems: CarouselItem[] = [
  { title: 'Card One', description: 'First card description' },
  { title: 'Card Two', description: 'Second card description' },
]

describe('CarouselBlock — testimonial mode', () => {
  it('renders the first testimonial quote on mount', () => {
    render(
      <CarouselBlock
        _type="carouselBlock"
        mode="testimonial"
        items={testimonialItems}
        showArrows={true}
        showIndicators={false}
        loop={false}
      />
    )
    expect(screen.getByText(/Amazing service!/)).toBeInTheDocument()
  })

  it('all slide groups are rendered in the DOM', () => {
    const { container } = render(
      <CarouselBlock
        _type="carouselBlock"
        mode="testimonial"
        items={testimonialItems}
        showArrows={false}
        showIndicators={false}
        loop={false}
      />
    )
    const slides = container.querySelectorAll('[role="group"][aria-roledescription="slide"]')
    expect(slides).toHaveLength(testimonialItems.length)
  })

  it('advances to the next slide when the Next arrow is clicked', () => {
    const { container } = render(
      <CarouselBlock
        _type="carouselBlock"
        mode="testimonial"
        items={testimonialItems}
        showArrows={true}
        showIndicators={false}
        loop={false}
      />
    )
    const nextBtn = container.querySelector('button[aria-label="Next slide"]') as HTMLButtonElement
    fireEvent.click(nextBtn)
    // After advancing, slide 2 should become visible
    const slide2 = container.querySelector('[aria-label="Slide 2 of 3"]') as HTMLElement
    expect(slide2.style.display).toBe('block')
  })

  it('renders dot indicators when showIndicators is true', () => {
    const { container } = render(
      <CarouselBlock
        _type="carouselBlock"
        mode="testimonial"
        items={testimonialItems}
        showArrows={false}
        showIndicators={true}
        loop={false}
      />
    )
    const indicators = container.querySelectorAll('button[role="tab"]')
    expect(indicators).toHaveLength(testimonialItems.length)
  })

  it('renders an optional title above the carousel', () => {
    render(
      <CarouselBlock
        _type="carouselBlock"
        mode="testimonial"
        title="Client Reviews"
        items={testimonialItems}
        showArrows={false}
        showIndicators={false}
        loop={false}
      />
    )
    expect(screen.getByRole('heading', { name: 'Client Reviews' })).toBeInTheDocument()
  })
})

describe('CarouselBlock — card mode', () => {
  it('renders the first card title on mount', () => {
    render(
      <CarouselBlock
        _type="carouselBlock"
        mode="card"
        items={cardItems}
        showArrows={true}
        showIndicators={false}
        loop={false}
      />
    )
    expect(screen.getByText('Card One')).toBeInTheDocument()
  })
})
