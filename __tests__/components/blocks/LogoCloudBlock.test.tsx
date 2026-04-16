import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import LogoCloudBlock from '@/components/blocks/LogoCloudBlock'
import type { LogoItem } from '@/types/cms'

const logos: LogoItem[] = [
  { src: null, alt: 'Acme Corp', name: 'Acme Corp' },
  { src: '/logos/beta.svg', alt: 'Beta Inc' },
  { src: null, alt: 'Gamma LLC', name: 'Gamma LLC' },
]

describe('LogoCloudBlock', () => {
  it('renders text fallback for logos without an image src', () => {
    render(<LogoCloudBlock _type="logoCloud" logos={logos} />)
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    expect(screen.getByText('Gamma LLC')).toBeInTheDocument()
  })

  it('renders an img element for logos with a src', () => {
    render(<LogoCloudBlock _type="logoCloud" logos={logos} />)
    const img = screen.getByRole('img', { name: 'Beta Inc' })
    expect(img).toHaveAttribute('src', '/logos/beta.svg')
  })

  it('renders the explicit title when provided', () => {
    render(
      <LogoCloudBlock _type="logoCloud" logos={logos} title="Our Partners" />
    )
    expect(screen.getByText('Our Partners')).toBeInTheDocument()
  })

  it('falls back to context as display title when title is absent', () => {
    render(
      <LogoCloudBlock
        _type="logoCloud"
        logos={logos}
        context="featured-in"
      />
    )
    expect(screen.getByText('featured-in')).toBeInTheDocument()
  })

  it('renders no title element when both title and context are absent', () => {
    const { container } = render(<LogoCloudBlock _type="logoCloud" logos={logos} />)
    // LogoCloud renders title as a <p>
    const titleEl = container.querySelector('[data-component="logo-cloud"] p')
    expect(titleEl).not.toBeInTheDocument()
  })

  it('wraps content in a data-component="logo-cloud-block" element', () => {
    const { container } = render(<LogoCloudBlock _type="logoCloud" logos={logos} />)
    expect(
      container.querySelector('[data-component="logo-cloud-block"]')
    ).toBeInTheDocument()
  })
})
