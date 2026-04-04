// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock @sanity/client before any import of lib/cms
vi.mock('@sanity/client', () => ({
  createClient: vi.fn(() => ({
    fetch: vi.fn(),
  })),
}))

vi.mock('@sanity/image-url', () => ({
  createImageUrlBuilder: vi.fn(() => ({
    image: vi.fn(() => ({ url: vi.fn(() => 'https://cdn.sanity.io/test') })),
  })),
}))

import { createClient } from '@sanity/client'
import { createCMSClient } from '@/lib/cms'

describe('createCMSClient', () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.resetModules()
    mockFetch = vi.fn()
    vi.mocked(createClient).mockReturnValue({ fetch: mockFetch } as any)
  })

  describe('getPages', () => {
    it('returns slugs from Sanity pages', async () => {
      mockFetch.mockResolvedValue([
        { slug: { current: 'home' } },
        { slug: { current: 'about' } },
        { slug: { current: 'menu' } },
      ])

      const cms = createCMSClient('testproject', 'restaurante-pepe-prod')
      const pages = await cms.getPages()

      expect(pages).toEqual([
        { slug: 'home' },
        { slug: 'about' },
        { slug: 'menu' },
      ])
    })

    it('returns empty array when no pages exist', async () => {
      mockFetch.mockResolvedValue([])
      const cms = createCMSClient('testproject', 'restaurante-pepe-prod')
      expect(await cms.getPages()).toEqual([])
    })
  })

  describe('getPage', () => {
    it('returns page with blocks', async () => {
      mockFetch.mockResolvedValue({
        slug: { current: 'about' },
        blocks: [
          { _type: 'hero', title: 'About Us' },
          { _type: 'contact', showMap: false, phone: '123456789' },
        ],
      })

      const cms = createCMSClient('testproject', 'restaurante-pepe-prod')
      const page = await cms.getPage('about')

      expect(page?.blocks[0]._type).toBe('hero')
      expect(page?.blocks[1]._type).toBe('contact')
    })

    it('returns null when page is not found', async () => {
      mockFetch.mockResolvedValue(null)
      const cms = createCMSClient('testproject', 'restaurante-pepe-prod')
      expect(await cms.getPage('nonexistent')).toBeNull()
    })
  })
})
