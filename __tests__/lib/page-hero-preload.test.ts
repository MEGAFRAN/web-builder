import { describe, it, expect } from 'vitest'
import {
  findHomepageHeroBackgroundImageUrl,
  HERO_BACKGROUND_IMAGE_PATH,
} from '@/lib/page-hero-preload'
import type { Block } from '@/types/cms'

describe('findHomepageHeroBackgroundImageUrl', () => {
  it('returns the blob hero path when heroBlock has a background image configured', () => {
    const blocks: Block[] = [
      { _type: 'navbar', logo: 'Acme' },
      {
        _type: 'heroBlock',
        heading: 'Welcome',
        backgroundImageUrl: 'https://example.com/legacy-hero.jpg',
      },
    ]

    expect(findHomepageHeroBackgroundImageUrl(blocks)).toBe(HERO_BACKGROUND_IMAGE_PATH)
  })

  it('returns null when no heroBlock is present', () => {
    const blocks: Block[] = [{ _type: 'navbar', logo: 'Acme' }]

    expect(findHomepageHeroBackgroundImageUrl(blocks)).toBeNull()
  })

  it('returns null when heroBlock has no background image', () => {
    const blocks: Block[] = [{ _type: 'heroBlock', heading: 'Welcome', backgroundImageUrl: null }]

    expect(findHomepageHeroBackgroundImageUrl(blocks)).toBeNull()
  })

  it('returns null for empty or missing block arrays', () => {
    expect(findHomepageHeroBackgroundImageUrl([])).toBeNull()
    expect(findHomepageHeroBackgroundImageUrl(undefined)).toBeNull()
  })
})
