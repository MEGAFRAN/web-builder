import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { HeroImagePreload } from '@/components/seo/HeroImagePreload'

const preload = vi.hoisted(() => vi.fn())

vi.mock('react-dom', () => ({
  default: { preload },
}))

describe('HeroImagePreload', () => {
  beforeEach(() => {
    preload.mockClear()
  })

  it('preloads the hero image with high fetch priority', () => {
    render(<HeroImagePreload href="https://example.com/hero.jpg" />)

    expect(preload).toHaveBeenCalledWith('https://example.com/hero.jpg', {
      as: 'image',
      fetchPriority: 'high',
    })
  })

  it('renders nothing visible', () => {
    const { container } = render(<HeroImagePreload href="https://example.com/hero.jpg" />)
    expect(container).toBeEmptyDOMElement()
  })
})
