import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/lib/client-config', () => ({
  getClientConfig: vi.fn(),
}))

import robots from '@/app/(site)/robots'
import sitemap from '@/app/(site)/sitemap'
import { getClientConfig } from '@/lib/client-config'

const mockedGetClientConfig = vi.mocked(getClientConfig)

const baseConfig = {
  clientId: 'test-client',
  displayName: 'Test Client',
  customDomain: 'example.com',
  swaResourceName: 'swa-test',
  features: { blog: false, booking: false, gallery: false, menu: false },
  theme: { primaryColor: '#000' },
  pages: [
    { slug: '', blocks: [] },
    { slug: 'contact', blocks: [] },
  ],
}

describe('robots route', () => {
  beforeEach(() => {
    vi.stubEnv('CLIENT_ID', 'test-client')
    mockedGetClientConfig.mockReturnValue(baseConfig as ReturnType<typeof getClientConfig>)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns robots config for the active client', () => {
    expect(robots()).toEqual({
      rules: { userAgent: '*', allow: '/' },
      sitemap: 'https://example.com/sitemap.xml',
    })
    expect(mockedGetClientConfig).toHaveBeenCalledWith('test-client')
  })
})

describe('sitemap route', () => {
  beforeEach(() => {
    vi.stubEnv('CLIENT_ID', 'test-client')
    mockedGetClientConfig.mockReturnValue(baseConfig as ReturnType<typeof getClientConfig>)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('uses trailing slashes when DEPLOY_TARGET is blob', () => {
    vi.stubEnv('DEPLOY_TARGET', 'blob')

    const entries = sitemap()

    expect(entries.map((entry) => entry.url)).toEqual([
      'https://example.com/',
      'https://example.com/contact/',
    ])
    expect(mockedGetClientConfig).toHaveBeenCalledWith('test-client')
  })

  it('omits trailing slashes for non-blob deploy targets', () => {
    vi.stubEnv('DEPLOY_TARGET', 'swa')

    const entries = sitemap()

    expect(entries.map((entry) => entry.url)).toEqual([
      'https://example.com',
      'https://example.com/contact',
    ])
  })
})
