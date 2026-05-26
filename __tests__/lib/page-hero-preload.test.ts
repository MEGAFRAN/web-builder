import { describe, it, expect } from 'vitest'
import { findHomepageHeroBackgroundImageUrl } from '@/lib/page-hero-preload'
import type { Block } from '@/types/cms'

describe('findHomepageHeroBackgroundImageUrl', () => {
  it('returns the configured URL when heroBlock has a background image', () => {
    const blocks: Block[] = [
      { _type: 'navbar', logo: 'Acme' },
      {
        _type: 'heroBlock',
        heading: 'Welcome',
        backgroundImageUrl: 'https://example.com/hero.jpg',
      },
    ]

    expect(findHomepageHeroBackgroundImageUrl(blocks)).toBe('https://example.com/hero.jpg')
  })

  it('returns a blob path when configured with a same-origin image', () => {
    const blocks: Block[] = [
      {
        _type: 'heroBlock',
        heading: 'Welcome',
        backgroundImageUrl: '/images/hero.webp',
      },
    ]

    expect(findHomepageHeroBackgroundImageUrl(blocks)).toBe('/images/hero.webp')
  })

  it('trims whitespace from the configured URL', () => {
    const blocks: Block[] = [
      {
        _type: 'heroBlock',
        heading: 'Welcome',
        backgroundImageUrl: '  /images/hero.webp  ',
      },
    ]

    expect(findHomepageHeroBackgroundImageUrl(blocks)).toBe('/images/hero.webp')
  })

  it('returns null when no heroBlock is present', () => {
    const blocks: Block[] = [{ _type: 'navbar', logo: 'Acme' }]

    expect(findHomepageHeroBackgroundImageUrl(blocks)).toBeNull()
  })

  it('returns null when heroBlock has no background image', () => {
    const blocks: Block[] = [{ _type: 'heroBlock', heading: 'Welcome', backgroundImageUrl: null }]

    expect(findHomepageHeroBackgroundImageUrl(blocks)).toBeNull()
  })

  it('returns null for empty or whitespace-only background image URLs', () => {
    const blocks: Block[] = [
      { _type: 'heroBlock', heading: 'Welcome', backgroundImageUrl: '' },
      { _type: 'heroBlock', heading: 'Welcome', backgroundImageUrl: '   ' },
    ]

    expect(findHomepageHeroBackgroundImageUrl([blocks[0]])).toBeNull()
    expect(findHomepageHeroBackgroundImageUrl([blocks[1]])).toBeNull()
  })

  it('returns null for empty or missing block arrays', () => {
    expect(findHomepageHeroBackgroundImageUrl([])).toBeNull()
    expect(findHomepageHeroBackgroundImageUrl(undefined)).toBeNull()
  })
})
