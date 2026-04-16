import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Heading } from '@/components/content/Heading'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const LEVEL_CASES = [
  ['h1', 'text-4xl', 'font-bold'],
  ['h2', 'text-3xl', 'font-bold'],
  ['h3', 'text-2xl', 'font-semibold'],
  ['h4', 'text-xl',  'font-semibold'],
] as const

const ALIGN_CASES = [
  ['left',   'text-left'],
  ['center', 'text-center'],
  ['right',  'text-right'],
] as const

const COLOR_CASES = [
  ['default', 'text-foreground'],
  ['muted',   'text-muted'],
  ['white',   'text-primary-fg'],
] as const

// ─── Helper ───────────────────────────────────────────────────────────────────

function renderHeading(props: React.ComponentProps<typeof Heading>) {
  const { container } = render(<Heading {...props} />)
  return container
}

function getRoot(container: HTMLElement) {
  return container.querySelector('[data-component="heading"]') as HTMLElement
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Heading', () => {
  describe('root element', () => {
    it('renders an element with data-component="heading"', () => {
      const container = renderHeading({ text: 'Title' })
      expect(getRoot(container)).not.toBeNull()
    })

    it('renders the provided text', () => {
      renderHeading({ text: 'Hello World' })
      expect(screen.getByText('Hello World')).toBeInTheDocument()
    })
  })

  describe('level prop', () => {
    it.each(LEVEL_CASES)(
      'level="%s" renders the correct HTML tag with size and weight classes',
      (level, sizeClass, weightClass) => {
        const container = renderHeading({ text: 'Title', level })
        const el = getRoot(container)
        expect(el.tagName.toLowerCase()).toBe(level)
        expect(el.className).toContain(sizeClass)
        expect(el.className).toContain(weightClass)
      },
    )

    it('defaults to h2 when level is omitted', () => {
      const container = renderHeading({ text: 'Title' })
      expect(getRoot(container).tagName.toLowerCase()).toBe('h2')
    })

    it('defaults to h2 when level={null}', () => {
      const container = renderHeading({ text: 'Title', level: null })
      expect(getRoot(container).tagName.toLowerCase()).toBe('h2')
    })

    it('is accessible — each level maps to the correct ARIA heading role', () => {
      renderHeading({ text: 'Page title', level: 'h1' })
      expect(screen.getByRole('heading', { level: 1, name: 'Page title' })).toBeInTheDocument()
    })
  })

  describe('align prop', () => {
    it.each(ALIGN_CASES)(
      'align="%s" applies the expected text-align class',
      (align, expectedClass) => {
        const container = renderHeading({ text: 'Title', align })
        expect(getRoot(container).className).toContain(expectedClass)
      },
    )

    it('defaults to text-left when align is omitted', () => {
      const container = renderHeading({ text: 'Title' })
      expect(getRoot(container).className).toContain('text-left')
    })

    it('defaults to text-left when align={null}', () => {
      const container = renderHeading({ text: 'Title', align: null })
      expect(getRoot(container).className).toContain('text-left')
    })
  })

  describe('color prop', () => {
    it.each(COLOR_CASES)(
      'color="%s" applies the expected text-color class',
      (color, expectedClass) => {
        const container = renderHeading({ text: 'Title', color })
        expect(getRoot(container).className).toContain(expectedClass)
      },
    )

    it('defaults to text-foreground when color is omitted', () => {
      const container = renderHeading({ text: 'Title' })
      expect(getRoot(container).className).toContain('text-foreground')
    })

    it('defaults to text-foreground when color={null}', () => {
      const container = renderHeading({ text: 'Title', color: null })
      expect(getRoot(container).className).toContain('text-foreground')
    })
  })

  describe('combined props', () => {
    it('correctly combines level, align, and color on a single element', () => {
      const container = renderHeading({ text: 'Sub', level: 'h3', align: 'center', color: 'muted' })
      const el = getRoot(container)
      expect(el.tagName.toLowerCase()).toBe('h3')
      expect(el.className).toContain('text-center')
      expect(el.className).toContain('text-muted')
      expect(el.className).toContain('text-2xl')
    })
  })
})
