import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { Carousel } from '@/components/sections/Carousel'
import type { CarouselBlock } from '@/types/cms'

// ─── jsdom shims ──────────────────────────────────────────────────────────────

// jsdom does not implement window.matchMedia — provide a minimal stub so that
// the Carousel's prefers-reduced-motion effect does not throw.
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

const TESTIMONIAL_ITEMS: CarouselBlock['items'] = [
  { quote: 'Great product!', author: 'Alice', role: 'CEO', company: 'Acme' },
  { quote: 'Highly recommend.', author: 'Bob', role: 'CTO', company: 'Globex' },
  { quote: 'Changed our workflow.', author: 'Carol', role: null, company: null },
]

const CARD_ITEMS: CarouselBlock['items'] = [
  { title: 'Card One', description: 'First card description' },
  { title: 'Card Two', description: 'Second card description' },
]

const IMAGE_ITEMS: CarouselBlock['items'] = [
  { imageUrl: '/img/a.jpg', imageAlt: 'Image A', caption: 'Caption A' },
  { imageUrl: '/img/b.jpg', imageAlt: 'Image B', caption: null },
]

function makeProps(overrides: Partial<CarouselBlock> = {}): CarouselBlock {
  return {
    _type: 'carouselBlock',
    items: TESTIMONIAL_ITEMS,
    mode: 'testimonial',
    showArrows: true,
    showIndicators: true,
    loop: false,
    background: 'white',
    paddingY: 'lg',
    ...overrides,
  }
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function renderCarousel(props: CarouselBlock) {
  const { container } = render(<Carousel {...props} />)
  return container
}

function getSection(container: HTMLElement) {
  return container.querySelector('section[data-component="carousel"]') as HTMLElement
}

function getTrack(container: HTMLElement) {
  return container.querySelector('.carousel-track') as HTMLDivElement
}

function getPrevBtn(container: HTMLElement) {
  return container.querySelector('button[aria-label="Previous slide"]') as HTMLButtonElement
}

function getNextBtn(container: HTMLElement) {
  return container.querySelector('button[aria-label="Next slide"]') as HTMLButtonElement
}

function getIndicatorBtns(container: HTMLElement) {
  return container.querySelectorAll('button[role="tab"]')
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Carousel', () => {
  describe('empty items', () => {
    it('renders a "No slides configured." message when items is empty', () => {
      renderCarousel(makeProps({ items: [] }))
      expect(screen.getByText('No slides configured.')).toBeInTheDocument()
    })

    it('does not render the carousel section when items is empty', () => {
      const container = renderCarousel(makeProps({ items: [] }))
      expect(getSection(container)).toBeNull()
    })
  })

  describe('root element', () => {
    it('renders a <section> with data-component="carousel"', () => {
      const container = renderCarousel(makeProps())
      expect(getSection(container)).not.toBeNull()
    })

    it('sets aria-label to the title when title is provided', () => {
      const container = renderCarousel(makeProps({ title: 'Customer Stories' }))
      expect(getSection(container).getAttribute('aria-label')).toBe('Customer Stories')
    })

    it('sets aria-label to "Image carousel" when title is omitted', () => {
      const container = renderCarousel(makeProps({ title: undefined }))
      expect(getSection(container).getAttribute('aria-label')).toBe('Image carousel')
    })
  })

  describe('title prop', () => {
    it('renders an <h2> with the title when provided', () => {
      renderCarousel(makeProps({ title: 'What our customers say' }))
      expect(screen.getByRole('heading', { level: 2, name: 'What our customers say' })).toBeInTheDocument()
    })

    it('does not render an <h2> when title is omitted', () => {
      const container = renderCarousel(makeProps({ title: undefined }))
      expect(container.querySelector('h2')).toBeNull()
    })

    it('does not render an <h2> when title={null}', () => {
      const container = renderCarousel(makeProps({ title: null }))
      expect(container.querySelector('h2')).toBeNull()
    })
  })

  describe('testimonial mode', () => {
    it('renders all slide containers with role="group"', () => {
      const container = renderCarousel(makeProps())
      const slides = container.querySelectorAll('[role="group"][aria-roledescription="slide"]')
      expect(slides).toHaveLength(TESTIMONIAL_ITEMS.length)
    })

    it('renders the first slide as visible (active)', () => {
      const container = renderCarousel(makeProps())
      const firstSlide = container.querySelector('[aria-label="Slide 1 of 3"]') as HTMLElement
      expect(firstSlide.style.visibility).toBe('visible')
    })

    it('renders subsequent slides as hidden initially', () => {
      const container = renderCarousel(makeProps())
      const secondSlide = container.querySelector('[aria-label="Slide 2 of 3"]') as HTMLElement
      expect(secondSlide.style.visibility).toBe('hidden')
    })

    it('renders the author name in the first slide', () => {
      renderCarousel(makeProps())
      expect(screen.getByText('Alice')).toBeInTheDocument()
    })

    it('renders the role when provided', () => {
      renderCarousel(makeProps())
      expect(screen.getByText('CEO')).toBeInTheDocument()
    })

    it('renders the company when provided', () => {
      renderCarousel(makeProps())
      expect(screen.getByText('Acme')).toBeInTheDocument()
    })

    it('renders the quote text', () => {
      renderCarousel(makeProps())
      expect(screen.getByText('Great product!')).toBeInTheDocument()
    })

    it('uses singular aria-label for a one-star rating', () => {
      renderCarousel(
        makeProps({
          items: [{ quote: 'Nice', author: 'Sam', stars: 1 }],
        }),
      )
      expect(screen.getByRole('img', { name: '1 star' })).toBeInTheDocument()
    })

    it('passes Author fallback to Avatar when author is null', () => {
      const container = renderCarousel(
        makeProps({
          items: [{ quote: 'No name attached', author: null }],
        }),
      )
      expect(container.querySelector('[data-component="avatar"]')).toHaveTextContent('A')
    })
  })

  describe('card mode', () => {
    it('renders cards with title and description', () => {
      renderCarousel(makeProps({ items: CARD_ITEMS, mode: 'card' }))
      expect(screen.getByText('Card One')).toBeInTheDocument()
      expect(screen.getByText('First card description')).toBeInTheDocument()
    })

    it('renders a card slide when title and description are null', () => {
      renderCarousel(
        makeProps({
          mode: 'card',
          items: [{ title: null, description: null }],
        }),
      )
      expect(
        document.querySelector('[aria-roledescription="slide"][aria-label="Slide 1 of 1"]'),
      ).not.toBeNull()
    })
  })

  describe('nullable Section props', () => {
    it('falls back Section background and padding when props are null', () => {
      const container = renderCarousel(makeProps({ background: null, paddingY: null }))
      const outerSection = container.querySelector('[data-component="section"]')
      expect(outerSection?.className).toContain('bg-background')
    })

    it('does not enable autoplay UI when autoPlay is null', () => {
      renderCarousel(makeProps({ autoPlay: null, items: TESTIMONIAL_ITEMS }))
      expect(screen.queryByRole('button', { name: /play slideshow|pause slideshow/i })).not.toBeInTheDocument()
    })
  })

  describe('image mode', () => {
    it('renders a <figure> with role="group" for each image slide', () => {
      const container = renderCarousel(makeProps({ items: IMAGE_ITEMS, mode: 'image' }))
      const figures = container.querySelectorAll('figure[role="group"]')
      expect(figures).toHaveLength(IMAGE_ITEMS.length)
    })

    it('renders caption when item has a caption', () => {
      renderCarousel(makeProps({ items: IMAGE_ITEMS, mode: 'image' }))
      expect(screen.getByText('Caption A')).toBeInTheDocument()
    })

    it('does not render a figcaption when caption is null', () => {
      const container = renderCarousel(makeProps({
        items: [{ imageUrl: '/img/b.jpg', imageAlt: 'Image B', caption: null }],
        mode: 'image',
      }))
      expect(container.querySelector('figcaption')).toBeNull()
    })

    it('passes empty strings to Image when url and alt are null', () => {
      renderCarousel(
        makeProps({
          mode: 'image',
          items: [{ imageUrl: null, imageAlt: null, caption: null }],
        }),
      )
      const imgs = document.querySelectorAll('img')
      expect(imgs.length).toBeGreaterThan(0)
      expect(imgs[0]).toHaveAttribute('alt', '')
    })
  })

  describe('arrow navigation', () => {
    it('renders prev and next arrow buttons', () => {
      const container = renderCarousel(makeProps())
      expect(getPrevBtn(container)).not.toBeNull()
      expect(getNextBtn(container)).not.toBeNull()
    })

    it('prev button is disabled on the first slide when loop=false', () => {
      const container = renderCarousel(makeProps({ loop: false }))
      expect(getPrevBtn(container).disabled).toBe(true)
    })

    it('next button is enabled on the first slide', () => {
      const container = renderCarousel(makeProps())
      expect(getNextBtn(container).disabled).toBe(false)
    })

    it('advances to the next slide when next button is clicked', () => {
      const container = renderCarousel(makeProps())
      fireEvent.click(getNextBtn(container))
      const secondSlide = container.querySelector('[aria-label="Slide 2 of 3"]') as HTMLElement
      expect(secondSlide.style.visibility).toBe('visible')
    })

    it('goes back to previous slide when prev button is clicked after advancing', () => {
      const container = renderCarousel(makeProps())
      fireEvent.click(getNextBtn(container))
      fireEvent.click(getPrevBtn(container))
      const firstSlide = container.querySelector('[aria-label="Slide 1 of 3"]') as HTMLElement
      expect(firstSlide.style.visibility).toBe('visible')
    })

    it('disables next button on the last slide when loop=false', () => {
      const container = renderCarousel(makeProps({ loop: false }))
      // Click next twice to reach last slide (index 2)
      fireEvent.click(getNextBtn(container))
      fireEvent.click(getNextBtn(container))
      expect(getNextBtn(container).disabled).toBe(true)
    })

    it('does not disable next button on the last slide when loop=true', () => {
      const container = renderCarousel(makeProps({ loop: true }))
      fireEvent.click(getNextBtn(container))
      fireEvent.click(getNextBtn(container))
      expect(getNextBtn(container).disabled).toBe(false)
    })

    it('wraps around to the first slide when next is clicked on the last slide with loop=true', () => {
      const container = renderCarousel(makeProps({ loop: true }))
      fireEvent.click(getNextBtn(container))
      fireEvent.click(getNextBtn(container))
      fireEvent.click(getNextBtn(container))
      const firstSlide = container.querySelector('[aria-label="Slide 1 of 3"]') as HTMLElement
      expect(firstSlide.style.visibility).toBe('visible')
    })

    it('hides arrows visually when showArrows=false but still renders them in DOM', () => {
      const container = renderCarousel(makeProps({ showArrows: false }))
      const prevBtn = getPrevBtn(container)
      // The button is in the DOM (for SSG) but aria-hidden and pointer-events-none
      expect(prevBtn).not.toBeNull()
      expect(prevBtn.getAttribute('aria-hidden')).toBe('true')
    })

    it('does not render arrow buttons when there is only 1 slide', () => {
      const container = renderCarousel(makeProps({ items: [TESTIMONIAL_ITEMS[0]] }))
      expect(getPrevBtn(container)).toBeNull()
      expect(getNextBtn(container)).toBeNull()
    })
  })

  describe('indicator dots', () => {
    it('renders one indicator button per slide', () => {
      const container = renderCarousel(makeProps())
      expect(getIndicatorBtns(container)).toHaveLength(TESTIMONIAL_ITEMS.length)
    })

    it('first indicator has aria-current="true" initially', () => {
      const container = renderCarousel(makeProps())
      const indicators = getIndicatorBtns(container)
      expect(indicators[0].getAttribute('aria-current')).toBe('true')
    })

    it('other indicators have aria-current="false" initially', () => {
      const container = renderCarousel(makeProps())
      const indicators = getIndicatorBtns(container)
      expect(indicators[1].getAttribute('aria-current')).toBe('false')
      expect(indicators[2].getAttribute('aria-current')).toBe('false')
    })

    it('clicking an indicator jumps directly to that slide', () => {
      const container = renderCarousel(makeProps())
      const indicators = getIndicatorBtns(container)
      fireEvent.click(indicators[2])
      const thirdSlide = container.querySelector('[aria-label="Slide 3 of 3"]') as HTMLElement
      expect(thirdSlide.style.visibility).toBe('visible')
    })

    it('updates aria-current when an indicator is clicked', () => {
      const container = renderCarousel(makeProps())
      const indicators = getIndicatorBtns(container)
      fireEvent.click(indicators[1])
      expect(indicators[1].getAttribute('aria-current')).toBe('true')
      expect(indicators[0].getAttribute('aria-current')).toBe('false')
    })

    it('does not render indicators when showIndicators=false', () => {
      const container = renderCarousel(makeProps({ showIndicators: false }))
      expect(getIndicatorBtns(container)).toHaveLength(0)
    })

    it('does not render indicators when there is only 1 slide', () => {
      const container = renderCarousel(makeProps({ items: [TESTIMONIAL_ITEMS[0]] }))
      expect(getIndicatorBtns(container)).toHaveLength(0)
    })

    it('renders a text counter instead of dots when there are more than 8 slides', () => {
      const manyItems = Array.from({ length: 9 }, (_, i) => ({
        quote: `Quote ${i}`,
        author: `Author ${i}`,
      }))
      renderCarousel(makeProps({ items: manyItems }))
      // Text counter should be present
      expect(screen.getByText('Slide 1 of 9')).toBeInTheDocument()
      // Individual tab buttons should not be present
      const container = document.querySelector('section[data-component="carousel"]')!
      expect(container.querySelectorAll('button[role="tab"]')).toHaveLength(0)
    })
  })

  describe('keyboard navigation', () => {
    it('advances to the next slide on ArrowRight key', () => {
      const container = renderCarousel(makeProps())
      const track = getTrack(container)
      fireEvent.keyDown(track, { key: 'ArrowRight' })
      const secondSlide = container.querySelector('[aria-label="Slide 2 of 3"]') as HTMLElement
      expect(secondSlide.style.visibility).toBe('visible')
    })

    it('goes to the previous slide on ArrowLeft key after advancing', () => {
      const container = renderCarousel(makeProps())
      const track = getTrack(container)
      fireEvent.keyDown(track, { key: 'ArrowRight' })
      fireEvent.keyDown(track, { key: 'ArrowLeft' })
      const firstSlide = container.querySelector('[aria-label="Slide 1 of 3"]') as HTMLElement
      expect(firstSlide.style.visibility).toBe('visible')
    })
  })

  describe('autoPlay prop', () => {
    it('renders a play/pause button when autoPlay=true and count > 1', () => {
      renderCarousel(makeProps({ autoPlay: true }))
      expect(
        screen.getByRole('button', { name: /play slideshow|pause slideshow/i })
      ).toBeInTheDocument()
    })

    it('does not render a play/pause button when autoPlay=false', () => {
      renderCarousel(makeProps({ autoPlay: false }))
      expect(screen.queryByRole('button', { name: /play slideshow|pause slideshow/i })).not.toBeInTheDocument()
    })

    it('does not render a play/pause button when autoPlay=true but there is only 1 item', () => {
      renderCarousel(makeProps({ autoPlay: true, items: [TESTIMONIAL_ITEMS[0]] }))
      expect(screen.queryByRole('button', { name: /play slideshow|pause slideshow/i })).not.toBeInTheDocument()
    })

    it('toggles playing state when the play/pause button is clicked', () => {
      renderCarousel(makeProps({ autoPlay: true }))
      const playBtn = screen.getByRole('button', { name: /pause slideshow/i })
      fireEvent.click(playBtn)
      expect(screen.getByRole('button', { name: /play slideshow/i })).toBeInTheDocument()
    })
  })

  describe('transition prop', () => {
    it('renders with slide transition by default', () => {
      const container = renderCarousel(makeProps({ transition: 'slide' }))
      const firstSlide = container.querySelector('[aria-label="Slide 1 of 3"]') as HTMLElement
      expect(firstSlide.style.transform).toContain('translateX')
    })

    it('renders with fade transition when transition="fade"', () => {
      const container = renderCarousel(makeProps({ transition: 'fade' }))
      const firstSlide = container.querySelector('[aria-label="Slide 1 of 3"]') as HTMLElement
      // In fade mode, opacity is used not transform
      expect(firstSlide.style.opacity).toBe('1')
    })
  })

  describe('accessibility', () => {
    it('track has role="region" and aria-live="polite"', () => {
      const container = renderCarousel(makeProps())
      const track = getTrack(container)
      expect(track.getAttribute('role')).toBe('region')
      expect(track.getAttribute('aria-live')).toBe('polite')
    })

    it('track has tabIndex=0 for keyboard focus', () => {
      const container = renderCarousel(makeProps())
      expect(getTrack(container).tabIndex).toBe(0)
    })

    it('each slide has aria-roledescription="slide"', () => {
      const container = renderCarousel(makeProps())
      const slides = container.querySelectorAll('[aria-roledescription="slide"]')
      expect(slides).toHaveLength(TESTIMONIAL_ITEMS.length)
    })

    it('indicators have role="tablist" with aria-label="Slides"', () => {
      const container = renderCarousel(makeProps())
      const tablist = container.querySelector('[role="tablist"]')
      expect(tablist).not.toBeNull()
      expect(tablist?.getAttribute('aria-label')).toBe('Slides')
    })
  })

  describe('swipe gestures on track', () => {
    it('advances to the next slide after a swipe-left gesture', () => {
      const container = renderCarousel(makeProps())
      const track = getTrack(container)
      fireEvent.pointerDown(track, { clientX: 260, clientY: 80 })
      fireEvent.pointerUp(track, { clientX: 140, clientY: 82 })
      const secondSlide = container.querySelector('[aria-label="Slide 2 of 3"]') as HTMLElement
      expect(secondSlide.style.visibility).toBe('visible')
    })

    it('returns to the previous slide after a swipe-right gesture', () => {
      const container = renderCarousel(makeProps())
      const track = getTrack(container)
      fireEvent.click(getNextBtn(container))
      fireEvent.pointerDown(track, { clientX: 140, clientY: 80 })
      fireEvent.pointerUp(track, { clientX: 260, clientY: 82 })
      const firstSlide = container.querySelector('[aria-label="Slide 1 of 3"]') as HTMLElement
      expect(firstSlide.style.visibility).toBe('visible')
    })
  })

  describe('prefers-reduced-motion', () => {
    afterEach(() => {
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
        }),
      )
    })

    it('shows play control when autoplay begins under reduced-motion preference', () => {
      vi.stubGlobal(
        'matchMedia',
        (query: string) => ({
          matches: query.includes('prefers-reduced-motion'),
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }),
      )
      renderCarousel(makeProps({ autoPlay: true }))
      expect(screen.getByRole('button', { name: /play slideshow/i })).toBeInTheDocument()
    })

    it('halts autoplay when reduced-motion query starts matching', () => {
      let onChange: ((event: MediaQueryListEvent) => void) | undefined
      vi.stubGlobal(
        'matchMedia',
        (query: string) => ({
          matches: false,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: (type: string, listener: EventListener) => {
            if (type === 'change' && query.includes('prefers-reduced-motion')) {
              onChange = listener as (event: MediaQueryListEvent) => void
            }
          },
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }),
      )
      renderCarousel(makeProps({ autoPlay: true }))
      expect(screen.getByRole('button', { name: /pause slideshow/i })).toBeInTheDocument()
      act(() => {
        onChange?.({ matches: true } as MediaQueryListEvent)
      })
      expect(screen.getByRole('button', { name: /play slideshow/i })).toBeInTheDocument()
    })
  })

  describe('autoplay with document visibility and hover', () => {
    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('pauses autoplay while the document is hidden and resumes when visible again', () => {
      const hiddenSpy = vi.spyOn(document, 'hidden', 'get')
      hiddenSpy.mockReturnValue(false)

      const container = renderCarousel(makeProps({ autoPlay: true, autoPlayInterval: 2000 }))

      act(() => {
        hiddenSpy.mockReturnValue(true)
        document.dispatchEvent(new Event('visibilitychange'))
      })
      act(() => {
        vi.advanceTimersByTime(20_000)
      })
      expect((container.querySelector('[aria-label="Slide 1 of 3"]') as HTMLElement).style.visibility).toBe(
        'visible',
      )

      act(() => {
        hiddenSpy.mockReturnValue(false)
        document.dispatchEvent(new Event('visibilitychange'))
      })
      act(() => {
        vi.advanceTimersByTime(2000)
      })

      expect((container.querySelector('[aria-label="Slide 2 of 3"]') as HTMLElement).style.visibility).toBe(
        'visible',
      )

      hiddenSpy.mockRestore()
    })

    it('pauses autoplay while the track is hovered and restarts after leave', () => {
      const container = renderCarousel(makeProps({ autoPlay: true, autoPlayInterval: 2000 }))
      const track = getTrack(container)

      act(() => {
        fireEvent.mouseEnter(track)
      })
      act(() => {
        vi.advanceTimersByTime(4000)
      })

      act(() => {
        fireEvent.mouseLeave(track)
      })
      act(() => {
        vi.advanceTimersByTime(2000)
      })

      expect((container.querySelector('[aria-label="Slide 2 of 3"]') as HTMLElement).style.visibility).toBe(
        'visible',
      )
    })

    it('clears autoplay while the track is focused and restarts after blur', () => {
      const container = renderCarousel(makeProps({ autoPlay: true, autoPlayInterval: 2000 }))
      const track = getTrack(container)

      act(() => {
        fireEvent.focus(track)
      })
      act(() => {
        vi.advanceTimersByTime(6000)
      })

      act(() => {
        fireEvent.blur(track)
      })
      act(() => {
        vi.advanceTimersByTime(2000)
      })

      expect((container.querySelector('[aria-label="Slide 2 of 3"]') as HTMLElement).style.visibility).toBe(
        'visible',
      )
    })

    it('stops autoplay at the last slide when loop is false', () => {
      const container = renderCarousel(
        makeProps({
          autoPlay: true,
          loop: false,
          autoPlayInterval: 2000,
          items: [TESTIMONIAL_ITEMS[0], TESTIMONIAL_ITEMS[1]],
        }),
      )

      act(() => {
        vi.advanceTimersByTime(2000)
      })
      expect((container.querySelector('[aria-label="Slide 2 of 2"]') as HTMLElement).style.visibility).toBe(
        'visible',
      )

      act(() => {
        vi.advanceTimersByTime(2000)
      })

      expect(screen.getByRole('button', { name: /play slideshow/i })).toBeInTheDocument()
      expect((container.querySelector('[aria-label="Slide 2 of 2"]') as HTMLElement).style.visibility).toBe(
        'visible',
      )
    })
  })
})
