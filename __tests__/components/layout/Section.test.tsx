import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Section } from '@/components/layout/Section'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const BACKGROUND_CASES = [
  ['white', 'bg-background'],
  ['gray',  'bg-muted-bg'],
  ['dark',  'bg-primary'],
] as const

// Expected paddingBlock values as serialised by jsdom:
// - numeric 0  → jsdom renders it as "0px"
// - CSS strings → passed through verbatim
const PADDING_Y_CASES = [
  ['none', '0px'],
  ['sm',   'calc(var(--section-spacing) * 0.4)'],
  ['md',   'calc(var(--section-spacing) * 0.6)'],
  ['lg',   'var(--section-spacing)'],
  ['xl',   'calc(var(--section-spacing) * 1.4)'],
] as const

// ─── Helper ───────────────────────────────────────────────────────────────────

function renderSection(props: React.ComponentProps<typeof Section> = {}) {
  const { container } = render(<Section {...props} />)
  return container
}

function getSection(container: HTMLElement) {
  return container.querySelector('section[data-component="section"]') as HTMLElement
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Section', () => {
  describe('root element', () => {
    it('renders a <section> with data-component="section"', () => {
      const container = renderSection()
      expect(getSection(container)).not.toBeNull()
    })

    it('always has class w-full', () => {
      const container = renderSection()
      expect(getSection(container).className).toContain('w-full')
    })
  })

  describe('background prop', () => {
    it.each(BACKGROUND_CASES)(
      'background="%s" applies class "%s"',
      (value, expectedClass) => {
        const container = renderSection({ background: value })
        expect(getSection(container).className).toContain(expectedClass)
      },
    )

    it('defaults to bg-background when background is omitted', () => {
      const container = renderSection()
      expect(getSection(container).className).toContain('bg-background')
    })

    it('falls back to bg-background when background={null}', () => {
      const container = renderSection({ background: null })
      expect(getSection(container).className).toContain('bg-background')
    })
  })

  describe('paddingY prop', () => {
    it.each(PADDING_Y_CASES)(
      'paddingY="%s" sets paddingBlock to "%s"',
      (value, expected) => {
        const container = renderSection({ paddingY: value })
        expect(getSection(container).style.paddingBlock).toBe(expected)
      },
    )

    it('defaults to var(--section-spacing) when paddingY is omitted', () => {
      const container = renderSection()
      expect(getSection(container).style.paddingBlock).toBe('var(--section-spacing)')
    })

    it('falls back to var(--section-spacing) when paddingY={null}', () => {
      const container = renderSection({ paddingY: null })
      expect(getSection(container).style.paddingBlock).toBe('var(--section-spacing)')
    })
  })

  describe('fullBleed prop', () => {
    it('sets data-full-bleed="true" when fullBleed={true}', () => {
      const container = renderSection({ fullBleed: true })
      expect(getSection(container).getAttribute('data-full-bleed')).toBe('true')
    })

    it('omits data-full-bleed attribute when fullBleed={false}', () => {
      const container = renderSection({ fullBleed: false })
      expect(getSection(container).hasAttribute('data-full-bleed')).toBe(false)
    })

    it('omits data-full-bleed attribute when fullBleed is omitted', () => {
      const container = renderSection()
      expect(getSection(container).hasAttribute('data-full-bleed')).toBe(false)
    })
  })

  describe('children', () => {
    it('renders children when provided', () => {
      renderSection({ children: <span>section child</span> })
      expect(screen.getByText('section child')).toBeInTheDocument()
    })

    it('renders without error when children is omitted', () => {
      const container = renderSection()
      expect(getSection(container)).not.toBeNull()
    })
  })
})
