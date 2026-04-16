import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Grid } from '@/components/layout/Grid'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const COLS_CASES = [
  ['1', 'grid-cols-1'],
  ['2', 'grid-cols-1 sm:grid-cols-2'],
  ['3', 'grid-cols-1 sm:grid-cols-3'],
  ['4', 'grid-cols-1 sm:grid-cols-4'],
] as const

const GAP_CASES = [
  ['none', 'gap-0'],
  ['sm',   'gap-2'],
  ['md',   'gap-4'],
  ['lg',   'gap-8'],
] as const

// ─── Helper ───────────────────────────────────────────────────────────────────

function renderGrid(props: React.ComponentProps<typeof Grid> = {}) {
  const { container } = render(<Grid {...props} />)
  return container
}

function getDiv(container: HTMLElement) {
  return container.querySelector('div[data-component="grid"]') as HTMLDivElement
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Grid', () => {
  describe('root element', () => {
    it('renders a <div> with data-component="grid"', () => {
      const container = renderGrid()
      expect(getDiv(container)).not.toBeNull()
    })

    it('always has class grid', () => {
      const container = renderGrid()
      expect(getDiv(container).className).toContain('grid')
    })
  })

  describe('cols prop', () => {
    it.each(COLS_CASES)(
      'cols="%s" applies class "%s"',
      (value, expectedClass) => {
        const container = renderGrid({ cols: value })
        const div = getDiv(container)
        // each token in the expected class string must be present
        for (const token of expectedClass.split(' ')) {
          expect(div.className).toContain(token)
        }
      },
    )

    it('defaults to grid-cols-1 sm:grid-cols-3 when cols is omitted', () => {
      const container = renderGrid()
      const div = getDiv(container)
      expect(div.className).toContain('grid-cols-1')
      expect(div.className).toContain('sm:grid-cols-3')
    })

    it('defaults to grid-cols-1 sm:grid-cols-3 when cols={null}', () => {
      const container = renderGrid({ cols: null })
      const div = getDiv(container)
      expect(div.className).toContain('grid-cols-1')
      expect(div.className).toContain('sm:grid-cols-3')
    })

    it('falls back to grid-cols-1 sm:grid-cols-3 for an unknown cols value', () => {
      const container = renderGrid({ cols: '99' })
      const div = getDiv(container)
      expect(div.className).toContain('grid-cols-1')
      expect(div.className).toContain('sm:grid-cols-3')
    })
  })

  describe('gap prop', () => {
    it.each(GAP_CASES)(
      'gap="%s" applies class "%s"',
      (value, expectedClass) => {
        const container = renderGrid({ gap: value })
        expect(getDiv(container).className).toContain(expectedClass)
      },
    )

    it('defaults to gap-4 when gap is omitted', () => {
      const container = renderGrid()
      expect(getDiv(container).className).toContain('gap-4')
    })

    it('defaults to gap-4 when gap={null}', () => {
      const container = renderGrid({ gap: null })
      expect(getDiv(container).className).toContain('gap-4')
    })

    it('falls back to gap-4 for an unknown gap value', () => {
      const container = renderGrid({ gap: 'huge' })
      expect(getDiv(container).className).toContain('gap-4')
    })
  })

  describe('children', () => {
    it('renders children when provided', () => {
      renderGrid({ children: <span>grid child</span> })
      expect(screen.getByText('grid child')).toBeInTheDocument()
    })

    it('renders without error when children is omitted', () => {
      const container = renderGrid()
      expect(getDiv(container)).not.toBeNull()
    })
  })
})
