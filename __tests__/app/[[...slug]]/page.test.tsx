// @vitest-environment jsdom
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import React from 'react'

// ---------------------------------------------------------------------------
// Mocks — vi.mock factories are hoisted before module-scope variable
// declarations, so the CMS client mock returns a stable object and we
// retrieve the individual fns via vi.mocked() after import.
// ---------------------------------------------------------------------------

vi.mock('@/lib/json-cms', () => ({
  createJSONCMSClient: vi.fn(() => ({
    getPages: vi.fn(),
    getPage: vi.fn(),
  })),
}))

vi.mock('@/lib/client-config', () => ({
  getClientConfig: vi.fn(),
}))

const mockFindHomepageHeroBackgroundImageUrl = vi.hoisted(() => vi.fn())
const mockPreload = vi.hoisted(() => vi.fn())

vi.mock('@/lib/page-hero-preload', () => ({
  findHomepageHeroBackgroundImageUrl: mockFindHomepageHeroBackgroundImageUrl,
}))

vi.mock('react-dom', () => ({
  default: { preload: mockPreload },
}))

vi.mock('@/components/PageRenderer', () => ({
  default: ({ blocks }: { blocks: unknown[] }) => (
    <div data-testid="page-renderer" data-blocks={JSON.stringify(blocks)} />
  ),
}))

// notFound() in Next.js throws internally — replicate that so the not-found
// branch in Page() exits the function as expected.
vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND')
  }),
}))

// ---------------------------------------------------------------------------
// Subject under test (imported after vi.mock declarations)
// ---------------------------------------------------------------------------
import { generateStaticParams, generateMetadata, default as Page } from '@/app/(site)/[[...slug]]/page'
import { createJSONCMSClient } from '@/lib/json-cms'
import { getClientConfig } from '@/lib/client-config'
import { notFound } from 'next/navigation'

// ---------------------------------------------------------------------------
// Typed mock helpers — retrieved once; individual fns are reset per test
// ---------------------------------------------------------------------------
const mockedCreateCMS = vi.mocked(createJSONCMSClient)
const mockedGetClientConfig = vi.mocked(getClientConfig)
type CMSClient = ReturnType<typeof createJSONCMSClient>

// These point at the same fn objects that createJSONCMSClient() returns.
// We grab them after the first mock call in beforeEach.
const mockGetPages = vi.fn<CMSClient['getPages']>()
const mockGetPage = vi.fn()

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------
const baseConfig = {
  clientId: 'test-client',
  displayName: 'Test Client',
  customDomain: 'test.com',
  swaResourceName: 'swa-test',
  features: { blog: false, booking: false, gallery: false, menu: false },
  theme: { primaryColor: '#000' },
  pages: [],
  siteMetadata: null,
}

beforeAll(() => {
  process.env.CLIENT_ID = 'test-client'
})

beforeEach(() => {
  vi.clearAllMocks()
  mockGetPages.mockReset()
  mockGetPage.mockReset()
  mockFindHomepageHeroBackgroundImageUrl.mockReset()
  mockFindHomepageHeroBackgroundImageUrl.mockReturnValue(null)
  mockPreload.mockReset()

  // Set up a fresh client stub for every test
  mockedGetClientConfig.mockReturnValue(baseConfig as ReturnType<typeof getClientConfig>)

  mockedCreateCMS.mockReturnValue({
    getPages: mockGetPages,
    getPage: mockGetPage,
    imageUrl: vi.fn((s: string) => s),
  })
})

// ---------------------------------------------------------------------------
// generateStaticParams
// ---------------------------------------------------------------------------
describe('generateStaticParams', () => {
  it('maps the home page slug ("") to an empty array', async () => {
    mockGetPages.mockResolvedValue([{ slug: '' }])
    const params = await generateStaticParams()
    expect(params).toContainEqual({ slug: [] })
  })

  it('maps a single-segment slug to a one-element array', async () => {
    mockGetPages.mockResolvedValue([{ slug: 'about' }])
    const params = await generateStaticParams()
    expect(params).toContainEqual({ slug: ['about'] })
  })

  it('maps a multi-segment slug to multiple array elements', async () => {
    mockGetPages.mockResolvedValue([{ slug: 'blog/post-1' }])
    const params = await generateStaticParams()
    expect(params).toContainEqual({ slug: ['blog', 'post-1'] })
  })

  it('handles a mixed set of slugs in one call', async () => {
    mockGetPages.mockResolvedValue([
      { slug: '' },
      { slug: 'about' },
      { slug: 'blog/post-1' },
    ])
    const params = await generateStaticParams()
    expect(params).toHaveLength(3)
    expect(params).toContainEqual({ slug: [] })
    expect(params).toContainEqual({ slug: ['about'] })
    expect(params).toContainEqual({ slug: ['blog', 'post-1'] })
  })
})

// ---------------------------------------------------------------------------
// generateMetadata
// ---------------------------------------------------------------------------
describe('generateMetadata', () => {
  // Convenience: build the Promise<{slug}> shape the function signature expects
  const makeParams = (slug?: string[]) => Promise.resolve({ slug })

  // ---- title resolution ---------------------------------------------------
  describe('title resolution', () => {
    it('applies titleTemplate when both pageMeta.title and titleTemplate are present', async () => {
      mockedGetClientConfig.mockReturnValue({
        ...baseConfig,
        siteMetadata: { titleTemplate: '%s | My Site', siteName: 'My Site' },
      } as ReturnType<typeof getClientConfig>)
      mockGetPage.mockResolvedValue({ metadata: { title: 'Home' }, blocks: [] })

      const meta = await generateMetadata({ params: makeParams([]) })
      expect(meta.title).toBe('Home | My Site')
    })

    it('uses pageMeta.title directly when titleTemplate is absent', async () => {
      mockedGetClientConfig.mockReturnValue({
        ...baseConfig,
        siteMetadata: { siteName: 'My Site' },
      } as ReturnType<typeof getClientConfig>)
      mockGetPage.mockResolvedValue({ metadata: { title: 'About' }, blocks: [] })

      const meta = await generateMetadata({ params: makeParams(['about']) })
      expect(meta.title).toBe('About')
    })

    it('falls back to siteName when pageMeta.title is absent', async () => {
      mockedGetClientConfig.mockReturnValue({
        ...baseConfig,
        siteMetadata: { siteName: 'My Site' },
      } as ReturnType<typeof getClientConfig>)
      mockGetPage.mockResolvedValue({ metadata: null, blocks: [] })

      const meta = await generateMetadata({ params: makeParams([]) })
      expect(meta.title).toBe('My Site')
    })

    it('falls back to config.displayName when pageMeta.title and siteName are both absent', async () => {
      mockedGetClientConfig.mockReturnValue({
        ...baseConfig,
        siteMetadata: {},
      } as ReturnType<typeof getClientConfig>)
      mockGetPage.mockResolvedValue({ metadata: null, blocks: [] })

      const meta = await generateMetadata({ params: makeParams([]) })
      expect(meta.title).toBe('Test Client')
    })

    it('falls back to config.displayName when siteMetadata itself is null', async () => {
      // baseConfig already has siteMetadata: null
      mockGetPage.mockResolvedValue({ metadata: null, blocks: [] })

      const meta = await generateMetadata({ params: makeParams([]) })
      expect(meta.title).toBe('Test Client')
    })

    it('calls getPage with "" when slug param is undefined', async () => {
      mockGetPage.mockResolvedValue({ metadata: { title: 'Root' }, blocks: [] })

      const meta = await generateMetadata({ params: makeParams(undefined) })
      expect(mockGetPage).toHaveBeenCalledWith('')
      expect(meta.title).toBe('Root')
    })

    it('joins a multi-segment slug into a path string when calling getPage', async () => {
      mockGetPage.mockResolvedValue({ metadata: { title: 'Deep' }, blocks: [] })

      await generateMetadata({ params: makeParams(['a', 'b', 'c']) })
      expect(mockGetPage).toHaveBeenCalledWith('a/b/c')
    })

    it('handles null page gracefully, falling back to displayName for title', async () => {
      mockGetPage.mockResolvedValue(null)

      const meta = await generateMetadata({ params: makeParams([]) })
      expect(meta.title).toBe('Test Client')
    })
  })

  // ---- description resolution ----------------------------------------------
  describe('description resolution', () => {
    it('uses pageMeta.description when present', async () => {
      mockGetPage.mockResolvedValue({ metadata: { description: 'Page desc' }, blocks: [] })
      const meta = await generateMetadata({ params: makeParams([]) })
      expect(meta.description).toBe('Page desc')
    })

    it('falls back to site defaultDescription when pageMeta.description is absent', async () => {
      mockedGetClientConfig.mockReturnValue({
        ...baseConfig,
        siteMetadata: { defaultDescription: 'Site desc' },
      } as ReturnType<typeof getClientConfig>)
      mockGetPage.mockResolvedValue({ metadata: {}, blocks: [] })

      const meta = await generateMetadata({ params: makeParams([]) })
      expect(meta.description).toBe('Site desc')
    })

    it('omits description when both pageMeta.description and defaultDescription are absent', async () => {
      mockGetPage.mockResolvedValue({ metadata: {}, blocks: [] })
      const meta = await generateMetadata({ params: makeParams([]) })
      expect(meta.description).toBeUndefined()
    })
  })

  // ---- openGraph resolution -----------------------------------------------
  describe('openGraph resolution', () => {
    it('includes openGraph block when pageMeta.ogImage is present', async () => {
      mockGetPage.mockResolvedValue({
        metadata: { title: 'Page', ogImage: 'https://img.com/og.jpg' },
        blocks: [],
      })
      const meta = await generateMetadata({ params: makeParams([]) })
      expect(meta.openGraph).toBeDefined()
      expect((meta.openGraph as { images: string[] }).images).toContain('https://img.com/og.jpg')
    })

    it('falls back to site defaultOgImage when pageMeta.ogImage is absent', async () => {
      mockedGetClientConfig.mockReturnValue({
        ...baseConfig,
        siteMetadata: { defaultOgImage: 'https://site.com/default-og.jpg' },
      } as ReturnType<typeof getClientConfig>)
      mockGetPage.mockResolvedValue({ metadata: {}, blocks: [] })

      const meta = await generateMetadata({ params: makeParams([]) })
      expect(meta.openGraph).toBeDefined()
      expect((meta.openGraph as { images: string[] }).images).toContain(
        'https://site.com/default-og.jpg'
      )
    })

    it('omits openGraph entirely when no ogImage is available', async () => {
      mockGetPage.mockResolvedValue({ metadata: {}, blocks: [] })
      const meta = await generateMetadata({ params: makeParams([]) })
      expect(meta.openGraph).toBeUndefined()
    })

    it('includes description in openGraph when description is available', async () => {
      mockGetPage.mockResolvedValue({
        metadata: { description: 'OG desc', ogImage: 'https://img.com/og.jpg' },
        blocks: [],
      })
      const meta = await generateMetadata({ params: makeParams([]) })
      expect((meta.openGraph as { description?: string }).description).toBe('OG desc')
    })

    it('omits description from openGraph when description is absent', async () => {
      mockGetPage.mockResolvedValue({
        metadata: { ogImage: 'https://img.com/og.jpg' },
        blocks: [],
      })
      const meta = await generateMetadata({ params: makeParams([]) })
      expect((meta.openGraph as { description?: string }).description).toBeUndefined()
    })
  })

  // ---- noIndex resolution --------------------------------------------------
  describe('noIndex resolution', () => {
    it('sets robots to noindex when pageMeta.noIndex is true', async () => {
      mockGetPage.mockResolvedValue({ metadata: { noIndex: true }, blocks: [] })
      const meta = await generateMetadata({ params: makeParams([]) })
      expect(meta.robots).toBe('noindex')
    })

    it('omits robots when pageMeta.noIndex is false', async () => {
      mockGetPage.mockResolvedValue({ metadata: { noIndex: false }, blocks: [] })
      const meta = await generateMetadata({ params: makeParams([]) })
      expect(meta.robots).toBeUndefined()
    })

    it('omits robots when pageMeta.noIndex is absent from metadata', async () => {
      mockGetPage.mockResolvedValue({ metadata: {}, blocks: [] })
      const meta = await generateMetadata({ params: makeParams([]) })
      expect(meta.robots).toBeUndefined()
    })
  })
})

// ---------------------------------------------------------------------------
// Page default export
// ---------------------------------------------------------------------------
describe('Page (default export)', () => {
  it('renders PageRenderer with blocks when slug is present', async () => {
    const blocks = [{ _type: 'hero' as const, title: 'Hello' }]
    mockGetPage.mockResolvedValue({ slug: 'about', blocks })

    const jsx = await Page({ params: Promise.resolve({ slug: ['about'] }) })
    const { getByTestId } = render(jsx as React.ReactElement)

    expect(getByTestId('page-renderer')).toBeTruthy()
  })

  it('renders PageRenderer and calls getPage with "" when slug is undefined (home)', async () => {
    const blocks = [{ _type: 'hero' as const, title: 'Home' }]
    mockGetPage.mockResolvedValue({ slug: '', blocks })

    const jsx = await Page({ params: Promise.resolve({ slug: undefined }) })
    const { getByTestId } = render(jsx as React.ReactElement)

    expect(mockGetPage).toHaveBeenCalledWith('')
    expect(getByTestId('page-renderer')).toBeTruthy()
  })

  it('calls notFound() and throws when page is not found', async () => {
    mockGetPage.mockResolvedValue(null)

    await expect(
      Page({ params: Promise.resolve({ slug: ['missing'] }) })
    ).rejects.toThrow('NEXT_NOT_FOUND')

    expect(notFound).toHaveBeenCalledOnce()
  })

  it('joins a multi-segment slug into a path string for getPage', async () => {
    mockGetPage.mockResolvedValue({ slug: 'blog/post-1', blocks: [] })

    await Page({ params: Promise.resolve({ slug: ['blog', 'post-1'] }) })
    expect(mockGetPage).toHaveBeenCalledWith('blog/post-1')
  })

  it('preloads the homepage hero background image when configured', async () => {
    const blocks = [
      {
        _type: 'heroBlock' as const,
        heading: 'Welcome',
        backgroundImageUrl: 'https://example.com/hero.jpg',
      },
    ]
    mockGetPage.mockResolvedValue({ slug: '', blocks })
    mockFindHomepageHeroBackgroundImageUrl.mockReturnValue('https://example.com/hero.jpg')

    const jsx = await Page({ params: Promise.resolve({ slug: undefined }) })
    render(jsx as React.ReactElement)

    expect(mockFindHomepageHeroBackgroundImageUrl).toHaveBeenCalledWith(blocks)
    expect(mockPreload).toHaveBeenCalledWith('https://example.com/hero.jpg', {
      as: 'image',
      fetchPriority: 'high',
    })
  })

  it('does not preload a hero image when backgroundImageUrl is absent', async () => {
    const blocks = [{ _type: 'heroBlock' as const, heading: 'Welcome' }]
    mockGetPage.mockResolvedValue({ slug: '', blocks })
    mockFindHomepageHeroBackgroundImageUrl.mockReturnValue(null)

    const jsx = await Page({ params: Promise.resolve({ slug: undefined }) })
    render(jsx as React.ReactElement)

    expect(mockPreload).not.toHaveBeenCalled()
  })
})
