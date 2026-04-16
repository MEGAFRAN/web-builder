import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { List } from '@/components/data/List'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const ITEMS = ['Alpha', 'Beta', 'Gamma']

const SIZE_CASES = [
  ['sm',   'text-sm'],
  ['base', 'text-base'],
  ['lg',   'text-lg'],
] as const

// ─── Helper ───────────────────────────────────────────────────────────────────

function renderList(props: React.ComponentProps<typeof List>) {
  const { container } = render(<List {...props} />)
  return container
}

function getRoot(container: HTMLElement) {
  return container.querySelector('[data-component="list"]') as HTMLElement
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('List', () => {
  describe('root element', () => {
    it('renders an element with data-component="list"', () => {
      const container = renderList({ items: ITEMS })
      expect(getRoot(container)).not.toBeNull()
    })
  })

  describe('ordered prop', () => {
    it('renders a <ul> by default when ordered is omitted', () => {
      const container = renderList({ items: ITEMS })
      expect(getRoot(container).tagName).toBe('UL')
    })

    it('renders a <ul> when ordered={false}', () => {
      const container = renderList({ items: ITEMS, ordered: false })
      expect(getRoot(container).tagName).toBe('UL')
    })

    it('renders a <ul> when ordered={null}', () => {
      const container = renderList({ items: ITEMS, ordered: null })
      expect(getRoot(container).tagName).toBe('UL')
    })

    it('renders an <ol> when ordered={true}', () => {
      const container = renderList({ items: ITEMS, ordered: true })
      expect(getRoot(container).tagName).toBe('OL')
    })

    it('applies list-disc class for unordered list', () => {
      const container = renderList({ items: ITEMS, ordered: false })
      expect(getRoot(container).className).toContain('list-disc')
    })

    it('applies list-decimal class for ordered list', () => {
      const container = renderList({ items: ITEMS, ordered: true })
      expect(getRoot(container).className).toContain('list-decimal')
    })
  })

  describe('items prop', () => {
    it('renders the correct number of <li> elements', () => {
      const container = renderList({ items: ITEMS })
      expect(container.querySelectorAll('li')).toHaveLength(ITEMS.length)
    })

    it('renders each item text inside a <li>', () => {
      renderList({ items: ITEMS })
      ITEMS.forEach((item) => {
        expect(screen.getByText(item).tagName).toBe('LI')
      })
    })

    it('renders a single item list correctly', () => {
      const container = renderList({ items: ['Only item'] })
      expect(container.querySelectorAll('li')).toHaveLength(1)
      expect(screen.getByText('Only item')).toBeInTheDocument()
    })

    it('renders an empty list with no <li> elements when items is empty', () => {
      const container = renderList({ items: [] })
      expect(container.querySelectorAll('li')).toHaveLength(0)
    })
  })

  describe('size prop', () => {
    it.each(SIZE_CASES)('size="%s" applies the "%s" class', (size, expectedClass) => {
      const container = renderList({ items: ITEMS, size })
      expect(getRoot(container).className).toContain(expectedClass)
    })

    it('defaults to text-base when size is omitted', () => {
      const container = renderList({ items: ITEMS })
      expect(getRoot(container).className).toContain('text-base')
    })

    it('defaults to text-base when size={null}', () => {
      const container = renderList({ items: ITEMS, size: null })
      expect(getRoot(container).className).toContain('text-base')
    })

    it('falls back to text-base for an unrecognised size string', () => {
      const container = renderList({ items: ITEMS, size: 'xl' })
      expect(getRoot(container).className).toContain('text-base')
    })
  })

  describe('base styling', () => {
    it('applies list-inside class', () => {
      const container = renderList({ items: ITEMS })
      expect(getRoot(container).className).toContain('list-inside')
    })

    it('applies text-foreground class', () => {
      const container = renderList({ items: ITEMS })
      expect(getRoot(container).className).toContain('text-foreground')
    })
  })
})
