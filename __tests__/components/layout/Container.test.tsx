import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Container } from '@/components/layout/Container'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MAX_WIDTH_CASES = [
  ['sm',   'max-w-sm'],
  ['md',   'max-w-md'],
  ['lg',   'max-w-lg'],
  ['xl',   'max-w-xl'],
  ['2xl',  'max-w-2xl'],
  ['full', 'max-w-full'],
] as const

// ─── Helper ───────────────────────────────────────────────────────────────────

function renderContainer(props: React.ComponentProps<typeof Container> = {}) {
  const { container } = render(<Container {...props} />)
  return container
}

function getDiv(container: HTMLElement) {
  return container.querySelector('div[data-component="container"]') as HTMLDivElement
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Container', () => {
  describe('root element', () => {
    it('renders a <div> with data-component="container"', () => {
      const container = renderContainer()
      expect(getDiv(container)).not.toBeNull()
    })
  })

  describe('base classes — always present', () => {
    it.each([
      ['no props',          {}],
      ['maxWidth="sm"',     { maxWidth: 'sm' as const }],
      ['maxWidth={null}',   { maxWidth: null }],
      ['padding="none"',    { padding: 'none' as const }],
      ['padding={null}',    { padding: null }],
    ])('contains mx-auto and w-full when %s', (_desc, props) => {
      const container = renderContainer(props)
      const div = getDiv(container)
      expect(div.className).toContain('mx-auto')
      expect(div.className).toContain('w-full')
    })
  })

  describe('maxWidth prop', () => {
    it.each(MAX_WIDTH_CASES)(
      'maxWidth="%s" applies class %s',
      (value, expectedClass) => {
        const container = renderContainer({ maxWidth: value })
        const div = getDiv(container)
        expect(div.className).toContain(expectedClass)
      },
    )

    it('applies max-w-xl by default when maxWidth is omitted', () => {
      const container = renderContainer()
      expect(getDiv(container).className).toContain('max-w-xl')
    })

    it('falls back to max-w-xl when maxWidth={null}', () => {
      const container = renderContainer({ maxWidth: null })
      expect(getDiv(container).className).toContain('max-w-xl')
    })
  })

  describe('padding prop', () => {
    it('sets paddingInline to var(--page-inset) and no px-* class when padding is omitted (defaults to "theme")', () => {
      const container = renderContainer()
      const div = getDiv(container)
      expect(div.style.paddingInline).toBe('var(--page-inset)')
      expect(div.className).not.toMatch(/\bpx-/)
    })

    it('sets paddingInline to var(--page-inset) and no px-* class when padding="theme" explicitly', () => {
      const container = renderContainer({ padding: 'theme' })
      const div = getDiv(container)
      expect(div.style.paddingInline).toBe('var(--page-inset)')
      expect(div.className).not.toMatch(/\bpx-/)
    })

    it('has no px-* class and no paddingInline style when padding="none"', () => {
      const container = renderContainer({ padding: 'none' })
      const div = getDiv(container)
      expect(div.className).not.toMatch(/\bpx-/)
      expect(div.style.paddingInline).toBe('')
    })

    it('has class px-4 and no paddingInline style when padding="sm"', () => {
      const container = renderContainer({ padding: 'sm' })
      const div = getDiv(container)
      expect(div.className).toContain('px-4')
      expect(div.style.paddingInline).toBe('')
    })

    it('has class px-6 and no paddingInline style when padding="md"', () => {
      const container = renderContainer({ padding: 'md' })
      const div = getDiv(container)
      expect(div.className).toContain('px-6')
      expect(div.style.paddingInline).toBe('')
    })

    it('has class px-8 and no paddingInline style when padding="lg"', () => {
      const container = renderContainer({ padding: 'lg' })
      const div = getDiv(container)
      expect(div.className).toContain('px-8')
      expect(div.style.paddingInline).toBe('')
    })

    it('has no px-* class and no paddingInline style when padding={null}', () => {
      const container = renderContainer({ padding: null })
      const div = getDiv(container)
      expect(div.className).not.toMatch(/\bpx-/)
      expect(div.style.paddingInline).toBe('')
    })
  })

  describe('children', () => {
    it('renders children when provided', () => {
      renderContainer({ children: <span>hello world</span> })
      expect(screen.getByText('hello world')).toBeInTheDocument()
    })

    it('renders without error when children is omitted', () => {
      const container = renderContainer()
      expect(getDiv(container)).not.toBeNull()
    })
  })
})
