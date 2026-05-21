import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Card } from '@/components/data/Card'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const PADDING_CASES = [
  ['sm', 'p-4'],
  ['md', 'p-6'],
  ['lg', 'p-8'],
] as const

// ─── Helper ───────────────────────────────────────────────────────────────────

function renderCard(props: React.ComponentProps<typeof Card> = {}) {
  const { container } = render(<Card {...props} />)
  return container
}

function getRoot(container: HTMLElement) {
  return container.querySelector('div[data-component="card"]') as HTMLDivElement
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Card', () => {
  describe('root element', () => {
    it('renders a <div> with data-component="card"', () => {
      const container = renderCard()
      expect(getRoot(container)).not.toBeNull()
    })

    it('always applies rounded-lg and bg-surface base classes', () => {
      const container = renderCard()
      expect(getRoot(container).className).toContain('rounded-lg')
      expect(getRoot(container).className).toContain('bg-surface')
    })
  })

  describe('title prop', () => {
    it('renders an <h3> with the title text when title is provided', () => {
      renderCard({ title: 'My Card' })
      const heading = screen.getByRole('heading', { level: 3, name: 'My Card' })
      expect(heading).toBeInTheDocument()
    })

    it('does not render an <h3> when title is omitted', () => {
      const container = renderCard()
      expect(container.querySelector('h3')).toBeNull()
    })

    it('does not render an <h3> when title={null}', () => {
      const container = renderCard({ title: null })
      expect(container.querySelector('h3')).toBeNull()
    })
  })

  describe('description prop', () => {
    it('renders a <p> with description text when description is provided', () => {
      renderCard({ description: 'Some description' })
      expect(screen.getByText('Some description').tagName).toBe('P')
    })

    it('does not render a description <p> when description is omitted', () => {
      const container = renderCard()
      // Only check that no <p> with mb-4 class (description marker) exists
      expect(container.querySelector('p.mb-4')).toBeNull()
    })

    it('does not render a description <p> when description={null}', () => {
      const container = renderCard({ description: null })
      expect(container.querySelector('p.mb-4')).toBeNull()
    })
  })

  describe('footer prop', () => {
    it('renders a <p> with footer text when footer is provided', () => {
      renderCard({ footer: 'Last updated today' })
      expect(screen.getByText('Last updated today').tagName).toBe('P')
    })

    it('applies border-t styling to the footer element', () => {
      const container = renderCard({ footer: 'Footer text' })
      const footerEl = container.querySelector('p.border-t')
      expect(footerEl).not.toBeNull()
      expect(footerEl?.textContent).toBe('Footer text')
    })

    it('does not render a footer element when footer is omitted', () => {
      const container = renderCard()
      expect(container.querySelector('p.border-t')).toBeNull()
    })

    it('does not render a footer element when footer={null}', () => {
      const container = renderCard({ footer: null })
      expect(container.querySelector('p.border-t')).toBeNull()
    })
  })

  describe('padding prop', () => {
    it.each(PADDING_CASES)('padding="%s" applies the "%s" class', (padding, expectedClass) => {
      const container = renderCard({ padding })
      expect(getRoot(container).className).toContain(expectedClass)
    })

    it('defaults to p-6 (md) when padding is omitted', () => {
      const container = renderCard()
      expect(getRoot(container).className).toContain('p-6')
    })

    it('defaults to p-6 (md) when padding={null}', () => {
      const container = renderCard({ padding: null })
      expect(getRoot(container).className).toContain('p-6')
    })

    it('falls back to p-6 for an unrecognised padding string', () => {
      const container = renderCard({ padding: 'xl' })
      expect(getRoot(container).className).toContain('p-6')
    })
  })

  describe('border prop', () => {
    it('renders with shadow-sm instead of a border by default', () => {
      const container = renderCard()
      expect(getRoot(container).className).toContain('shadow-sm')
      expect(getRoot(container).className).not.toContain('border-border')
    })

    it('renders with shadow-sm when border={true}', () => {
      const container = renderCard({ border: true })
      expect(getRoot(container).className).toContain('shadow-sm')
    })

    it('does not render a border when border={false}', () => {
      const container = renderCard({ border: false })
      // The border classes should not be present
      expect(getRoot(container).className).not.toContain('border-border')
    })

    it('renders with shadow-sm when border={null}', () => {
      const container = renderCard({ border: null })
      expect(getRoot(container).className).toContain('shadow-sm')
    })
  })

  describe('children prop', () => {
    it('renders children content inside the card', () => {
      const container = renderCard({ children: <span data-testid="child">Hello</span> })
      expect(container.querySelector('[data-testid="child"]')).not.toBeNull()
    })

    it('renders children after the description and before the footer', () => {
      const { container } = render(
        <Card description="desc" footer="foot">
          <span data-testid="child">Content</span>
        </Card>,
      )
      const root = getRoot(container)
      const children = Array.from(root.children)
      const descIndex = children.findIndex((el) => el.textContent === 'desc')
      // The child <span> is a direct child of root
      const childIndex = children.findIndex((el) => el.getAttribute('data-testid') === 'child')
      const footIndex = children.findIndex((el) => el.classList.contains('border-t'))
      expect(descIndex).toBeGreaterThanOrEqual(0)
      expect(childIndex).toBeGreaterThanOrEqual(0)
      expect(footIndex).toBeGreaterThanOrEqual(0)
      expect(descIndex).toBeLessThan(childIndex)
      expect(childIndex).toBeLessThan(footIndex)
    })

    it('renders no children area when children is omitted', () => {
      const container = renderCard({ title: 'Only title' })
      // Nothing unexpected beyond the heading
      expect(container.querySelector('[data-testid="child"]')).toBeNull()
    })
  })

  describe('combined props', () => {
    it('renders title, description, children, and footer all together', () => {
      const container = renderCard({
        title: 'Title',
        description: 'Desc',
        footer: 'Footer',
        children: <span>Child</span>,
      })
      expect(container.querySelector('h3')?.textContent).toBe('Title')
      expect(container.querySelector('p.mb-4')?.textContent).toBe('Desc')
      expect(screen.getByText('Child')).toBeInTheDocument()
      expect(container.querySelector('p.border-t')?.textContent).toBe('Footer')
    })
  })
})
