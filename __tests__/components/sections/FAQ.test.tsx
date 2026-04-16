import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FAQ } from '@/components/sections/FAQ'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const ITEMS = [
  { question: 'What is your return policy?', answer: 'You can return within 30 days.' },
  { question: 'Do you offer free shipping?', answer: 'Yes, on orders over $50.' },
  { question: 'How do I track my order?', answer: 'Check your email for a tracking link.' },
]

// ─── Helper ───────────────────────────────────────────────────────────────────

function renderFAQ(props: React.ComponentProps<typeof FAQ>) {
  const { container } = render(<FAQ {...props} />)
  return container
}

function getRoot(container: HTMLElement) {
  return container.querySelector('div[data-component="faq"]') as HTMLDivElement
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('FAQ', () => {
  describe('root element', () => {
    it('renders a <div> with data-component="faq"', () => {
      const container = renderFAQ({ items: ITEMS })
      expect(getRoot(container)).not.toBeNull()
    })
  })

  describe('title prop', () => {
    it('renders an <h2> with the title when provided', () => {
      renderFAQ({ title: 'Frequently Asked Questions', items: ITEMS })
      expect(screen.getByRole('heading', { level: 2, name: 'Frequently Asked Questions' })).toBeInTheDocument()
    })

    it('does not render an <h2> when title is omitted', () => {
      const container = renderFAQ({ items: ITEMS })
      expect(container.querySelector('h2')).toBeNull()
    })

    it('does not render an <h2> when title={null}', () => {
      const container = renderFAQ({ title: null, items: ITEMS })
      expect(container.querySelector('h2')).toBeNull()
    })
  })

  describe('items rendering', () => {
    it('renders all question buttons', () => {
      renderFAQ({ items: ITEMS })
      ITEMS.forEach(({ question }) => {
        expect(screen.getByText(question)).toBeInTheDocument()
      })
    })

    it('renders no answers initially (all collapsed)', () => {
      renderFAQ({ items: ITEMS })
      ITEMS.forEach(({ answer }) => {
        expect(screen.queryByText(answer)).not.toBeInTheDocument()
      })
    })

    it('renders a "+" indicator for each collapsed item initially', () => {
      const container = renderFAQ({ items: ITEMS })
      const indicators = container.querySelectorAll('span.text-muted')
      // Each item has a +/− indicator
      const plusSigns = Array.from(indicators).filter((el) => el.textContent === '+')
      expect(plusSigns).toHaveLength(ITEMS.length)
    })
  })

  describe('accordion interaction', () => {
    it('shows the answer when a question button is clicked', () => {
      renderFAQ({ items: ITEMS })
      fireEvent.click(screen.getByText(ITEMS[0].question))
      expect(screen.getByText(ITEMS[0].answer)).toBeInTheDocument()
    })

    it('shows "−" indicator for the open item after click', () => {
      renderFAQ({ items: ITEMS })
      fireEvent.click(screen.getByText(ITEMS[0].question))
      expect(screen.getByText('−')).toBeInTheDocument()
    })

    it('hides the answer when the same question is clicked again (toggle)', () => {
      renderFAQ({ items: ITEMS })
      const btn = screen.getByText(ITEMS[0].question)
      fireEvent.click(btn)
      expect(screen.getByText(ITEMS[0].answer)).toBeInTheDocument()
      fireEvent.click(btn)
      expect(screen.queryByText(ITEMS[0].answer)).not.toBeInTheDocument()
    })

    it('closes a previously open item when another is opened', () => {
      renderFAQ({ items: ITEMS })
      fireEvent.click(screen.getByText(ITEMS[0].question))
      expect(screen.getByText(ITEMS[0].answer)).toBeInTheDocument()

      fireEvent.click(screen.getByText(ITEMS[1].question))
      expect(screen.queryByText(ITEMS[0].answer)).not.toBeInTheDocument()
      expect(screen.getByText(ITEMS[1].answer)).toBeInTheDocument()
    })

    it('only shows one answer at a time', () => {
      renderFAQ({ items: ITEMS })
      fireEvent.click(screen.getByText(ITEMS[2].question))
      const visibleAnswers = ITEMS.filter(({ answer }) => screen.queryByText(answer))
      expect(visibleAnswers).toHaveLength(1)
    })
  })

  describe('combined props', () => {
    it('renders title and all items together', () => {
      renderFAQ({ title: 'FAQ', items: ITEMS })
      expect(screen.getByRole('heading', { level: 2, name: 'FAQ' })).toBeInTheDocument()
      ITEMS.forEach(({ question }) => {
        expect(screen.getByText(question)).toBeInTheDocument()
      })
    })
  })
})
