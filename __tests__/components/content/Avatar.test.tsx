import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Avatar } from '@/components/content/Avatar'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const SIZE_CASES = [
  ['sm', 'h-8',  'w-8',  'text-xs'],
  ['md', 'h-10', 'w-10', 'text-sm'],
  ['lg', 'h-14', 'w-14', 'text-base'],
] as const

const INITIALS_CASES = [
  ['Alice',          'A'],
  ['Bob Smith',      'BS'],
  ['Carol Ann Day',  'CA'],  // only first two initials kept
  ['dave',           'D'],   // lower-case input → upper-case initials
] as const

// ─── Helper ───────────────────────────────────────────────────────────────────

function renderAvatar(props: React.ComponentProps<typeof Avatar>) {
  const { container } = render(<Avatar {...props} />)
  return container
}

function getFallbackRoot(container: HTMLElement) {
  return container.querySelector('div[data-component="avatar"]') as HTMLDivElement
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Avatar', () => {
  describe('image mode (src provided)', () => {
    it('renders an <img> with the correct src and alt when src is provided', () => {
      renderAvatar({ src: '/photo.jpg', name: 'Alice' })
      const img = screen.getByRole('img', { name: 'Alice' }) as HTMLImageElement
      expect(img).toBeInTheDocument()
      expect(img.src).toContain('/photo.jpg')
    })

    it('applies rounded-full and object-cover classes to the img', () => {
      const container = renderAvatar({ src: '/photo.jpg', name: 'Alice' })
      const img = container.querySelector('img') as HTMLImageElement
      expect(img.className).toContain('rounded-full')
      expect(img.className).toContain('object-cover')
    })

    it('does NOT render the fallback <div> when src is provided', () => {
      const container = renderAvatar({ src: '/photo.jpg', name: 'Alice' })
      expect(getFallbackRoot(container)).toBeNull()
    })

    it.each(SIZE_CASES)(
      'applies size="%s" classes to the img',
      (size, h, w) => {
        const container = renderAvatar({ src: '/photo.jpg', name: 'Alice', size })
        const img = container.querySelector('img') as HTMLImageElement
        expect(img.className).toContain(h)
        expect(img.className).toContain(w)
      },
    )
  })

  describe('fallback mode (no src)', () => {
    it('renders a <div> with data-component="avatar" when src is omitted', () => {
      const container = renderAvatar({ name: 'Alice' })
      expect(getFallbackRoot(container)).not.toBeNull()
    })

    it('does NOT render an <img> when src is omitted', () => {
      const container = renderAvatar({ name: 'Alice' })
      expect(container.querySelector('img')).toBeNull()
    })

    it('does NOT render an <img> when src={null}', () => {
      const container = renderAvatar({ name: 'Alice', src: null })
      expect(container.querySelector('img')).toBeNull()
    })

    it.each(INITIALS_CASES)(
      'derives correct initials "%s" → "%s"',
      (name, expectedInitials) => {
        renderAvatar({ name })
        expect(screen.getByText(expectedInitials)).toBeInTheDocument()
      },
    )

    it('applies rounded-full to the fallback div', () => {
      const container = renderAvatar({ name: 'Alice' })
      expect(getFallbackRoot(container).className).toContain('rounded-full')
    })

    it.each(SIZE_CASES)(
      'size="%s" applies height, width, and text-size classes to the fallback div',
      (size, h, w, textSize) => {
        const container = renderAvatar({ name: 'Alice', size })
        const cls = getFallbackRoot(container).className
        expect(cls).toContain(h)
        expect(cls).toContain(w)
        expect(cls).toContain(textSize)
      },
    )

    it('defaults to md size when size is omitted', () => {
      const container = renderAvatar({ name: 'Alice' })
      const cls = getFallbackRoot(container).className
      expect(cls).toContain('h-10')
      expect(cls).toContain('w-10')
    })

    it('defaults to md size when size={null}', () => {
      const container = renderAvatar({ name: 'Alice', size: null })
      const cls = getFallbackRoot(container).className
      expect(cls).toContain('h-10')
      expect(cls).toContain('w-10')
    })

    it('falls back to md size for an unrecognised size string', () => {
      const container = renderAvatar({ name: 'Alice', size: 'xl' })
      const cls = getFallbackRoot(container).className
      expect(cls).toContain('h-10')
      expect(cls).toContain('w-10')
    })
  })
})
