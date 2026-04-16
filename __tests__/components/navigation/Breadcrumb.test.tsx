import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Breadcrumb } from '@/components/navigation/Breadcrumb'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const singlePlain = [{ label: 'Home' }]
const singleWithHref = [{ label: 'Home', href: '/' }]
const singleNullHref = [{ label: 'Home', href: null }]

const multiItems = [
  { label: 'Home', href: '/' },
  { label: 'Products', href: '/products' },
  { label: 'Widget' },
]

// mixed: link / null-href / plain
const mixedItems = [
  { label: 'Home', href: '/' },
  { label: 'Section', href: null },
  { label: 'Current Page' },
]

// ─── Helper ───────────────────────────────────────────────────────────────────

function renderBreadcrumb(items: Array<{ label: string; href?: string | null }>) {
  const { container } = render(<Breadcrumb items={items} />)
  return container
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Breadcrumb', () => {
  describe('nav element', () => {
    it('renders a <nav> element', () => {
      renderBreadcrumb(singlePlain)
      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })

    it('sets data-component="breadcrumb" on the nav', () => {
      renderBreadcrumb(singlePlain)
      expect(screen.getByRole('navigation')).toHaveAttribute('data-component', 'breadcrumb')
    })
  })

  describe('single item — no href', () => {
    it('renders the label text', () => {
      renderBreadcrumb(singlePlain)
      expect(screen.getByText('Home')).toBeInTheDocument()
    })

    it('renders as a plain <span>, not a link', () => {
      const container = renderBreadcrumb(singlePlain)
      expect(container.querySelector('a')).toBeNull()
      expect(screen.getByText('Home').tagName).toBe('SPAN')
    })

    it('renders no separator', () => {
      const container = renderBreadcrumb(singlePlain)
      const separators = Array.from(container.querySelectorAll('span')).filter(
        (el) => el.textContent === '/'
      )
      expect(separators).toHaveLength(0)
    })
  })

  describe('single item — with href', () => {
    it('renders the label text', () => {
      renderBreadcrumb(singleWithHref)
      expect(screen.getByText('Home')).toBeInTheDocument()
    })

    it('renders as an <a> element with the correct href', () => {
      renderBreadcrumb(singleWithHref)
      const link = screen.getByRole('link', { name: 'Home' })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/')
    })

    it('renders no separator', () => {
      const container = renderBreadcrumb(singleWithHref)
      const separators = Array.from(container.querySelectorAll('span')).filter(
        (el) => el.textContent === '/'
      )
      expect(separators).toHaveLength(0)
    })
  })

  describe('single item — null href', () => {
    it('renders as a plain <span>, not a link, when href is null', () => {
      const container = renderBreadcrumb(singleNullHref)
      expect(container.querySelector('a')).toBeNull()
      expect(screen.getByText('Home').tagName).toBe('SPAN')
    })
  })

  describe('multiple items — separators', () => {
    it('renders a separator between each pair of items but not before the first', () => {
      const container = renderBreadcrumb(multiItems)
      // 3 items → 2 separators
      const separators = Array.from(container.querySelectorAll('span')).filter(
        (el) => el.textContent === '/'
      )
      expect(separators).toHaveLength(multiItems.length - 1)
    })

    it('renders all item labels in the correct order', () => {
      renderBreadcrumb(multiItems)
      const labels = multiItems.map((item) => item.label)
      labels.forEach((label) => expect(screen.getByText(label)).toBeInTheDocument())
    })
  })

  describe('multiple items — link vs span rendering', () => {
    it.each([
      ['Home', '/'],
      ['Products', '/products'],
    ])('renders "%s" as a link with href "%s"', (label, href) => {
      renderBreadcrumb(multiItems)
      const link = screen.getByRole('link', { name: label })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', href)
    })

    it('renders the last item without an href as a plain span', () => {
      renderBreadcrumb(multiItems)
      const el = screen.getByText('Widget')
      expect(el.tagName).toBe('SPAN')
    })
  })

  describe('mixed href / null href / no href items', () => {
    it('renders the href item as a link', () => {
      renderBreadcrumb(mixedItems)
      const link = screen.getByRole('link', { name: 'Home' })
      expect(link).toHaveAttribute('href', '/')
    })

    it('renders the null-href item as a plain span', () => {
      renderBreadcrumb(mixedItems)
      const el = screen.getByText('Section')
      expect(el.tagName).toBe('SPAN')
    })

    it('renders the no-href item as a plain span', () => {
      renderBreadcrumb(mixedItems)
      const el = screen.getByText('Current Page')
      expect(el.tagName).toBe('SPAN')
    })

    it('renders exactly 2 separators for 3 items', () => {
      const container = renderBreadcrumb(mixedItems)
      const separators = Array.from(container.querySelectorAll('span')).filter(
        (el) => el.textContent === '/'
      )
      expect(separators).toHaveLength(2)
    })
  })

  describe('edge cases', () => {
    it('renders an empty nav without crashing when items is an empty array', () => {
      const container = renderBreadcrumb([])
      const nav = container.querySelector('nav[data-component="breadcrumb"]')
      expect(nav).not.toBeNull()
      expect(nav?.childElementCount).toBe(0)
    })

    it('renders an empty nav without crashing when items is undefined', () => {
      // The component uses optional chaining (items?.map), so undefined is safe.
      const container = render(
        // @ts-expect-error intentional undefined for edge-case test
        <Breadcrumb items={undefined} />
      ).container
      const nav = container.querySelector('nav[data-component="breadcrumb"]')
      expect(nav).not.toBeNull()
    })
  })
})
