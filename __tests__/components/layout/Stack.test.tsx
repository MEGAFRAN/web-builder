import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Stack } from '@/components/layout/Stack'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

// Expected gap values as serialised by jsdom:
// - numeric 0  → jsdom renders it as "0px"
// - CSS strings → passed through verbatim
const GAP_CASES = [
  ['none', '0px'],
  ['sm',   'calc(var(--content-gap) * 0.5)'],
  ['md',   'var(--content-gap)'],
  ['lg',   'calc(var(--content-gap) * 2)'],
  ['xl',   'calc(var(--content-gap) * 3)'],
] as const

const ALIGN_CASES = [
  ['start',   'items-start'],
  ['center',  'items-center'],
  ['end',     'items-end'],
  ['stretch', 'items-stretch'],
] as const

// ─── Helper ───────────────────────────────────────────────────────────────────

function renderStack(props: React.ComponentProps<typeof Stack> = {}) {
  const { container } = render(<Stack {...props} />)
  return container
}

function getDiv(container: HTMLElement) {
  return container.querySelector('div[data-component="stack"]') as HTMLDivElement
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Stack', () => {
  describe('root element', () => {
    it('renders a <div> with data-component="stack"', () => {
      const container = renderStack()
      expect(getDiv(container)).not.toBeNull()
    })

    it('always has class flex', () => {
      const container = renderStack()
      expect(getDiv(container).className).toContain('flex')
    })

    it('always has class flex-col', () => {
      const container = renderStack()
      expect(getDiv(container).className).toContain('flex-col')
    })
  })

  describe('gap prop', () => {
    it.each(GAP_CASES)(
      'gap="%s" sets style.gap to "%s"',
      (value, expected) => {
        const container = renderStack({ gap: value })
        expect(getDiv(container).style.gap).toBe(expected)
      },
    )

    it('defaults to var(--content-gap) when gap is omitted', () => {
      const container = renderStack()
      expect(getDiv(container).style.gap).toBe('var(--content-gap)')
    })

    it('falls back to var(--content-gap) when gap={null}', () => {
      const container = renderStack({ gap: null })
      expect(getDiv(container).style.gap).toBe('var(--content-gap)')
    })
  })

  describe('align prop', () => {
    it.each(ALIGN_CASES)(
      'align="%s" applies class "%s"',
      (value, expectedClass) => {
        const container = renderStack({ align: value })
        expect(getDiv(container).className).toContain(expectedClass)
      },
    )

    it('defaults to items-stretch when align is omitted', () => {
      const container = renderStack()
      expect(getDiv(container).className).toContain('items-stretch')
    })

    it('falls back to items-stretch when align={null}', () => {
      const container = renderStack({ align: null })
      expect(getDiv(container).className).toContain('items-stretch')
    })
  })

  describe('children', () => {
    it('renders children when provided', () => {
      renderStack({ children: <span>stack child</span> })
      expect(screen.getByText('stack child')).toBeInTheDocument()
    })

    it('renders without error when children is omitted', () => {
      const container = renderStack()
      expect(getDiv(container)).not.toBeNull()
    })
  })
})
