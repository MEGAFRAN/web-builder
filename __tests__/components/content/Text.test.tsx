import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Text } from '@/components/content/Text'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const SIZE_CASES = [
  ['sm',   'text-sm'],
  ['base', 'text-base'],
  ['lg',   'text-lg'],
  ['xl',   'text-xl'],
] as const

const COLOR_CASES = [
  ['default', 'text-foreground'],
  ['muted',   'text-muted'],
  ['white',   'text-primary-fg'],
] as const

const WEIGHT_CASES = [
  ['normal',   'font-normal'],
  ['medium',   'font-medium'],
  ['semibold', 'font-semibold'],
] as const

const ALIGN_CASES = [
  ['left',   'text-left'],
  ['center', 'text-center'],
  ['right',  'text-right'],
] as const

// ─── Helper ───────────────────────────────────────────────────────────────────

function renderText(props: React.ComponentProps<typeof Text>) {
  const { container } = render(<Text {...props} />)
  return container
}

function getRoot(container: HTMLElement) {
  return container.querySelector('p[data-component="text"]') as HTMLParagraphElement
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Text', () => {
  describe('root element', () => {
    it('renders a <p> with data-component="text"', () => {
      const container = renderText({ content: 'Hello' })
      expect(getRoot(container)).not.toBeNull()
    })

    it('renders the content string', () => {
      renderText({ content: 'Some paragraph text' })
      expect(screen.getByText('Some paragraph text')).toBeInTheDocument()
    })
  })

  describe('size prop', () => {
    it.each(SIZE_CASES)('size="%s" applies the expected class', (size, expectedClass) => {
      const container = renderText({ content: 'txt', size })
      expect(getRoot(container).className).toContain(expectedClass)
    })

    it('defaults to text-base when size is omitted', () => {
      const container = renderText({ content: 'txt' })
      expect(getRoot(container).className).toContain('text-base')
    })

    it('defaults to text-base when size={null}', () => {
      const container = renderText({ content: 'txt', size: null })
      expect(getRoot(container).className).toContain('text-base')
    })
  })

  describe('color prop', () => {
    it.each(COLOR_CASES)('color="%s" applies the expected class', (color, expectedClass) => {
      const container = renderText({ content: 'txt', color })
      expect(getRoot(container).className).toContain(expectedClass)
    })

    it('defaults to text-foreground when color is omitted', () => {
      const container = renderText({ content: 'txt' })
      expect(getRoot(container).className).toContain('text-foreground')
    })

    it('defaults to text-foreground when color={null}', () => {
      const container = renderText({ content: 'txt', color: null })
      expect(getRoot(container).className).toContain('text-foreground')
    })
  })

  describe('weight prop', () => {
    it.each(WEIGHT_CASES)('weight="%s" applies the expected class', (weight, expectedClass) => {
      const container = renderText({ content: 'txt', weight })
      expect(getRoot(container).className).toContain(expectedClass)
    })

    it('defaults to font-normal when weight is omitted', () => {
      const container = renderText({ content: 'txt' })
      expect(getRoot(container).className).toContain('font-normal')
    })

    it('defaults to font-normal when weight={null}', () => {
      const container = renderText({ content: 'txt', weight: null })
      expect(getRoot(container).className).toContain('font-normal')
    })
  })

  describe('align prop', () => {
    it.each(ALIGN_CASES)('align="%s" applies the expected class', (align, expectedClass) => {
      const container = renderText({ content: 'txt', align })
      expect(getRoot(container).className).toContain(expectedClass)
    })

    it('defaults to text-left when align is omitted', () => {
      const container = renderText({ content: 'txt' })
      expect(getRoot(container).className).toContain('text-left')
    })

    it('defaults to text-left when align={null}', () => {
      const container = renderText({ content: 'txt', align: null })
      expect(getRoot(container).className).toContain('text-left')
    })
  })

  describe('combined props', () => {
    it('correctly combines all four style props on a single element', () => {
      const container = renderText({
        content: 'Styled',
        size: 'lg',
        color: 'muted',
        weight: 'semibold',
        align: 'center',
      })
      const cls = getRoot(container).className
      expect(cls).toContain('text-lg')
      expect(cls).toContain('text-muted')
      expect(cls).toContain('font-semibold')
      expect(cls).toContain('text-center')
    })
  })
})
