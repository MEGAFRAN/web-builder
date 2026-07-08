import { describe, it, expect } from 'vitest'
import {
  buildPageUrl,
  buildRobotsConfig,
  buildSitemapEntries,
  buildSitemapFromConfig,
  getSiteBaseUrl,
} from '@/lib/site-seo'
import type { ClientConfig, ClientPage } from '@/types/cms'

describe('getSiteBaseUrl', () => {
  it('returns an https URL from the custom domain', () => {
    expect(getSiteBaseUrl('example.com')).toBe('https://example.com')
  })
})

describe('buildPageUrl', () => {
  const baseUrl = 'https://example.com'

  it('builds the homepage without a trailing slash when disabled', () => {
    expect(buildPageUrl(baseUrl, '', false)).toBe('https://example.com')
  })

  it('builds the homepage with a trailing slash when enabled', () => {
    expect(buildPageUrl(baseUrl, '', true)).toBe('https://example.com/')
  })

  it('builds nested pages without a trailing slash when disabled', () => {
    expect(buildPageUrl(baseUrl, 'success-cases/acme', false)).toBe(
      'https://example.com/success-cases/acme',
    )
  })

  it('builds nested pages with a trailing slash when enabled', () => {
    expect(buildPageUrl(baseUrl, 'contact', true)).toBe('https://example.com/contact/')
  })
})

describe('buildRobotsConfig', () => {
  it('allows all crawlers and points to the sitemap', () => {
    expect(buildRobotsConfig('example.com')).toEqual({
      rules: { userAgent: '*', allow: '/' },
      sitemap: 'https://example.com/sitemap.xml',
    })
  })
})

describe('buildSitemapEntries', () => {
  const pages: ClientPage[] = [
    { slug: '', blocks: [] },
    { slug: 'contact', blocks: [] },
    { slug: 'private', blocks: [], metadata: { noIndex: true } },
  ]

  it('excludes pages marked noIndex', () => {
    const entries = buildSitemapEntries(pages, 'example.com', true)

    expect(entries.map((entry) => entry.url)).toEqual([
      'https://example.com/',
      'https://example.com/contact/',
    ])
  })

  it('assigns higher priority to the homepage', () => {
    const entries = buildSitemapEntries(pages, 'example.com', false)

    expect(entries[0]?.priority).toBe(1.0)
    expect(entries[1]?.priority).toBe(0.8)
  })

  it('assigns weekly change frequency to the homepage and monthly to other pages', () => {
    const entries = buildSitemapEntries(pages, 'example.com', false)

    expect(entries[0]?.changeFrequency).toBe('weekly')
    expect(entries[1]?.changeFrequency).toBe('monthly')
  })
})

describe('buildSitemapFromConfig', () => {
  it('builds sitemap entries from the client config', () => {
    const config = {
      customDomain: 'example.com',
      pages: [
        { slug: '', blocks: [] },
        { slug: 'about', blocks: [] },
      ],
    } as ClientConfig

    const entries = buildSitemapFromConfig(config, false)

    expect(entries.map((entry) => entry.url)).toEqual([
      'https://example.com',
      'https://example.com/about',
    ])
  })
})
