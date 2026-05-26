import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Image } from '@/components/content/Image'

// ─── Helper ───────────────────────────────────────────────────────────────────

function renderImage(props: React.ComponentProps<typeof Image>) {
  const { container } = render(<Image {...props} alt={props.alt ?? ''} />)
  return container
}

function getImg(container: HTMLElement) {
  return container.querySelector('img[data-component="image"]') as HTMLImageElement
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Image', () => {
  describe('fixed mode (fill omitted / false)', () => {
    it('renders an <img> with data-component="image"', () => {
      const container = renderImage({ src: '/img.png', alt: 'A photo' })
      expect(getImg(container)).not.toBeNull()
    })

    it('sets src and alt attributes correctly', () => {
      renderImage({ src: '/img.png', alt: 'A photo' })
      const img = screen.getByRole('img', { name: 'A photo' }) as HTMLImageElement
      expect(img.src).toContain('/img.png')
    })

    it('always applies max-w-full class', () => {
      const container = renderImage({ src: '/img.png', alt: 'A photo' })
      expect(getImg(container).className).toContain('max-w-full')
    })

    it('applies width and height attributes when provided', () => {
      const container = renderImage({ src: '/img.png', alt: 'pic', width: 640, height: 480 })
      const img = getImg(container)
      expect(img.width).toBe(640)
      expect(img.height).toBe(480)
    })

    it('omits width and height attributes when not provided', () => {
      const container = renderImage({ src: '/img.png', alt: 'pic' })
      const img = getImg(container)
      // jsdom returns 0 for missing numeric attributes
      expect(img.getAttribute('width')).toBeNull()
      expect(img.getAttribute('height')).toBeNull()
    })

    it('omits width and height attributes when set to null', () => {
      const container = renderImage({ src: '/img.png', alt: 'pic', width: null, height: null })
      const img = getImg(container)
      expect(img.getAttribute('width')).toBeNull()
      expect(img.getAttribute('height')).toBeNull()
    })

    it('applies rounded-full and object-cover when rounded={true}', () => {
      const container = renderImage({ src: '/img.png', alt: 'pic', rounded: true })
      const cls = getImg(container).className
      expect(cls).toContain('rounded-full')
      expect(cls).toContain('object-cover')
    })

    it('does not apply rounded-full when rounded is omitted', () => {
      const container = renderImage({ src: '/img.png', alt: 'pic' })
      expect(getImg(container).className).not.toContain('rounded-full')
    })

    it('does not apply rounded-full when rounded={false}', () => {
      const container = renderImage({ src: '/img.png', alt: 'pic', rounded: false })
      expect(getImg(container).className).not.toContain('rounded-full')
    })

    it('does not apply rounded-full when rounded={null}', () => {
      const container = renderImage({ src: '/img.png', alt: 'pic', rounded: null })
      expect(getImg(container).className).not.toContain('rounded-full')
    })
  })

  describe('fill mode (fill=true)', () => {
    it('renders an <img> with data-component="image" in fill mode', () => {
      const container = renderImage({ src: '/hero.jpg', alt: 'Hero', fill: true })
      expect(getImg(container)).not.toBeNull()
    })

    it('applies absolute inset-0 h-full w-full positioning classes', () => {
      const container = renderImage({ src: '/hero.jpg', alt: 'Hero', fill: true })
      const cls = getImg(container).className
      expect(cls).toContain('absolute')
      expect(cls).toContain('inset-0')
      expect(cls).toContain('h-full')
      expect(cls).toContain('w-full')
    })

    it('defaults to loading="lazy" when loading is omitted', () => {
      const container = renderImage({ src: '/hero.jpg', alt: 'Hero', fill: true })
      expect(getImg(container).getAttribute('loading')).toBe('lazy')
    })

    it('respects an explicit loading="eager" value', () => {
      const container = renderImage({ src: '/hero.jpg', alt: 'Hero', fill: true, loading: 'eager' })
      expect(getImg(container).getAttribute('loading')).toBe('eager')
    })

    it('defaults to objectFit="cover" style when objectFit is omitted', () => {
      const container = renderImage({ src: '/hero.jpg', alt: 'Hero', fill: true })
      expect(getImg(container).style.objectFit).toBe('cover')
    })

    it('applies objectFit="contain" style when specified', () => {
      const container = renderImage({ src: '/hero.jpg', alt: 'Hero', fill: true, objectFit: 'contain' })
      expect(getImg(container).style.objectFit).toBe('contain')
    })

    it('defaults to fetchpriority="auto" when fetchPriority is omitted', () => {
      const container = renderImage({ src: '/hero.jpg', alt: 'Hero', fill: true })
      expect(getImg(container).getAttribute('fetchpriority')).toBe('auto')
    })

    it('applies fetchpriority="high" when fetchPriority="high"', () => {
      const container = renderImage({ src: '/hero.jpg', alt: 'Hero', fill: true, fetchPriority: 'high' })
      expect(getImg(container).getAttribute('fetchpriority')).toBe('high')
    })

    it('applies rounded-full when fill=true and rounded={true}', () => {
      const container = renderImage({ src: '/hero.jpg', alt: 'Hero', fill: true, rounded: true })
      expect(getImg(container).className).toContain('rounded-full')
    })

    it('does not apply rounded-full when fill=true and rounded is omitted', () => {
      const container = renderImage({ src: '/hero.jpg', alt: 'Hero', fill: true })
      expect(getImg(container).className).not.toContain('rounded-full')
    })
  })

  describe('accessibility', () => {
    it('exposes the image via its alt text in both fixed and fill modes', () => {
      const { unmount } = render(<Image src="/a.png" alt="Descriptive text" />)
      expect(screen.getByRole('img', { name: 'Descriptive text' })).toBeInTheDocument()
      unmount()

      render(<Image src="/a.png" alt="Fill mode alt" fill />)
      expect(screen.getByRole('img', { name: 'Fill mode alt' })).toBeInTheDocument()
    })
  })
})
