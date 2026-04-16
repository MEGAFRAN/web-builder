import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LogoCloud } from '@/components/sections/LogoCloud'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const LOGOS_WITH_SRC = [
  { src: '/logos/acme.png',  alt: 'Acme Corp',    name: 'Acme Corp' },
  { src: '/logos/globex.png', alt: 'Globex',       name: 'Globex' },
]

const LOGOS_WITHOUT_SRC = [
  { src: null,  alt: 'TechCorp', name: 'TechCorp' },
  { src: null,  alt: 'Initech',  name: null },  // falls back to alt
]

const LOGOS_MIXED = [
  { src: '/logos/acme.png', alt: 'Acme' },
  { src: null, alt: 'Globex', name: 'Globex' },
]

// ─── Helper ───────────────────────────────────────────────────────────────────

function renderLogoCloud(props: React.ComponentProps<typeof LogoCloud>) {
  const { container } = render(<LogoCloud {...props} />)
  return container
}

function getRoot(container: HTMLElement) {
  return container.querySelector('div[data-component="logo-cloud"]') as HTMLDivElement
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('LogoCloud', () => {
  describe('root element', () => {
    it('renders a <div> with data-component="logo-cloud"', () => {
      const container = renderLogoCloud({ logos: LOGOS_WITH_SRC })
      expect(getRoot(container)).not.toBeNull()
    })
  })

  describe('title prop', () => {
    it('renders a <p> with title text when title is provided', () => {
      renderLogoCloud({ title: 'Trusted by 500+ companies', logos: LOGOS_WITH_SRC })
      const p = screen.getByText('Trusted by 500+ companies')
      expect(p.tagName).toBe('P')
    })

    it('does not render a title when title is omitted', () => {
      const container = renderLogoCloud({ logos: LOGOS_WITH_SRC })
      expect(container.querySelector('p')).toBeNull()
    })

    it('does not render a title when title={null}', () => {
      const container = renderLogoCloud({ title: null, logos: LOGOS_WITH_SRC })
      expect(container.querySelector('p')).toBeNull()
    })
  })

  describe('logos with src', () => {
    it('renders an <img> for each logo that has a src', () => {
      const container = renderLogoCloud({ logos: LOGOS_WITH_SRC })
      const imgs = container.querySelectorAll('img')
      expect(imgs).toHaveLength(LOGOS_WITH_SRC.length)
    })

    it('sets the correct src attribute on each logo image', () => {
      const container = renderLogoCloud({ logos: LOGOS_WITH_SRC })
      const imgs = container.querySelectorAll('img')
      expect(imgs[0].getAttribute('src')).toBe('/logos/acme.png')
      expect(imgs[1].getAttribute('src')).toBe('/logos/globex.png')
    })

    it('sets the correct alt attribute on each logo image', () => {
      const container = renderLogoCloud({ logos: LOGOS_WITH_SRC })
      const imgs = container.querySelectorAll('img')
      expect(imgs[0].getAttribute('alt')).toBe('Acme Corp')
      expect(imgs[1].getAttribute('alt')).toBe('Globex')
    })

    it('applies grayscale and opacity classes to logo images', () => {
      const container = renderLogoCloud({ logos: LOGOS_WITH_SRC })
      const img = container.querySelector('img') as HTMLImageElement
      expect(img.className).toContain('grayscale')
      expect(img.className).toContain('opacity-60')
    })
  })

  describe('logos without src', () => {
    it('renders a <span> for each logo that has no src', () => {
      const container = renderLogoCloud({ logos: LOGOS_WITHOUT_SRC })
      expect(container.querySelector('img')).toBeNull()
      const spans = container.querySelectorAll('span.text-sm')
      expect(spans).toHaveLength(LOGOS_WITHOUT_SRC.length)
    })

    it('shows the name when name is provided and src is absent', () => {
      renderLogoCloud({ logos: [{ src: null, alt: 'X', name: 'TechCorp' }] })
      expect(screen.getByText('TechCorp')).toBeInTheDocument()
    })

    it('falls back to alt text when name is null and src is absent', () => {
      renderLogoCloud({ logos: [{ src: null, alt: 'Initech', name: null }] })
      expect(screen.getByText('Initech')).toBeInTheDocument()
    })
  })

  describe('mixed logos', () => {
    it('renders img for src logos and span for srcless logos', () => {
      const container = renderLogoCloud({ logos: LOGOS_MIXED })
      expect(container.querySelectorAll('img')).toHaveLength(1)
      expect(container.querySelectorAll('span.text-sm')).toHaveLength(1)
    })
  })

  describe('combined props', () => {
    it('renders title and all logos together', () => {
      renderLogoCloud({ title: 'Partners', logos: LOGOS_MIXED })
      expect(screen.getByText('Partners')).toBeInTheDocument()
    })
  })
})
