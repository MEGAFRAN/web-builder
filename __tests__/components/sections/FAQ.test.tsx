import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FAQ } from '@/components/sections/FAQ'

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
      }),
    )
  }
})

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

    it('keeps answers collapsed initially', () => {
      renderFAQ({ items: ITEMS })
      ITEMS.forEach(({ question }) => {
        const button = screen.getByRole('button', { name: question })
        expect(button).toHaveAttribute('aria-expanded', 'false')
      })
    })

    it('renders a chevron icon for each item', () => {
      const container = renderFAQ({ items: ITEMS })
      expect(container.querySelectorAll('svg[aria-hidden="true"]')).toHaveLength(
        ITEMS.length,
      )
    })
  })

  describe('accordion interaction', () => {
    it('shows the answer when a question button is clicked', () => {
      renderFAQ({ items: ITEMS })
      const button = screen.getByRole('button', { name: ITEMS[0].question })
      fireEvent.click(button)
      expect(button).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getByText(ITEMS[0].answer)).toBeVisible()
    })

    it('marks the open item with aria-expanded after click', () => {
      renderFAQ({ items: ITEMS })
      const button = screen.getByRole('button', { name: ITEMS[0].question })
      fireEvent.click(button)
      expect(button).toHaveAttribute('aria-expanded', 'true')
    })

    it('collapses the answer when the same question is clicked again (toggle)', () => {
      renderFAQ({ items: ITEMS })
      const button = screen.getByRole('button', { name: ITEMS[0].question })
      fireEvent.click(button)
      fireEvent.click(button)
      expect(button).toHaveAttribute('aria-expanded', 'false')
    })

    it('closes a previously open item when another is opened', () => {
      renderFAQ({ items: ITEMS })
      const first = screen.getByRole('button', { name: ITEMS[0].question })
      const second = screen.getByRole('button', { name: ITEMS[1].question })
      fireEvent.click(first)
      fireEvent.click(second)
      expect(first).toHaveAttribute('aria-expanded', 'false')
      expect(second).toHaveAttribute('aria-expanded', 'true')
    })

    it('only shows one answer expanded at a time', () => {
      renderFAQ({ items: ITEMS })
      fireEvent.click(screen.getByRole('button', { name: ITEMS[2].question }))
      const expanded = screen
        .getAllByRole('button')
        .filter((button) => button.getAttribute('aria-expanded') === 'true')
      expect(expanded).toHaveLength(1)
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
