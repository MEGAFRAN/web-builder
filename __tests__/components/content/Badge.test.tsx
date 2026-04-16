import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from '@/components/content/Badge'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const VARIANT_CASES = [
  ['default', 'bg-muted-bg',    'text-foreground'],
  ['success', 'bg-green-100',   'text-green-700'],
  ['warning', 'bg-yellow-100',  'text-yellow-700'],
  ['error',   'bg-red-100',     'text-red-700'],
] as const

// ─── Helper ───────────────────────────────────────────────────────────────────

function renderBadge(props: React.ComponentProps<typeof Badge>) {
  const { container } = render(<Badge {...props} />)
  return container
}

function getRoot(container: HTMLElement) {
  return container.querySelector('span[data-component="badge"]') as HTMLSpanElement
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Badge', () => {
  describe('root element', () => {
    it('renders a <span> with data-component="badge"', () => {
      const container = renderBadge({ label: 'New' })
      expect(getRoot(container)).not.toBeNull()
    })

    it('always applies inline-flex and rounded-full base classes', () => {
      const container = renderBadge({ label: 'New' })
      const cls = getRoot(container).className
      expect(cls).toContain('inline-flex')
      expect(cls).toContain('rounded-full')
    })
  })

  describe('label prop', () => {
    it('renders the label text inside the span', () => {
      renderBadge({ label: 'Beta' })
      expect(screen.getByText('Beta')).toBeInTheDocument()
    })
  })

  describe('variant prop', () => {
    it.each(VARIANT_CASES)(
      'variant="%s" applies the expected bg and text color classes',
      (variant, bg, text) => {
        const container = renderBadge({ label: 'tag', variant })
        const cls = getRoot(container).className
        expect(cls).toContain(bg)
        expect(cls).toContain(text)
      },
    )

    it('defaults to default variant when variant is omitted', () => {
      const container = renderBadge({ label: 'tag' })
      expect(getRoot(container).className).toContain('bg-muted-bg')
    })

    it('defaults to default variant when variant={null}', () => {
      const container = renderBadge({ label: 'tag', variant: null })
      expect(getRoot(container).className).toContain('bg-muted-bg')
    })

    it('falls back to default variant for an unrecognised variant string', () => {
      const container = renderBadge({ label: 'tag', variant: 'premium' })
      expect(getRoot(container).className).toContain('bg-muted-bg')
    })
  })
})
