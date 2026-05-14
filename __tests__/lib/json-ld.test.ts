import { describe, it, expect } from 'vitest'
import { buildJsonLd } from '@/lib/json-ld'
import type { ClientConfig, ClientPage } from '@/types/cms'

function cfg(partial: Partial<ClientConfig>): ClientConfig {
  return {
    clientId: 'acme-corp',
    displayName: 'Acme Corp',
    customDomain: 'acme.example',
    swaResourceName: 'swa-acme',
    features: { blog: false, booking: false, gallery: false, menu: false },
    theme: {},
    pages: [],
    ...partial,
  }
}

function page(slug: string, meta?: ClientPage['metadata']): ClientPage {
  return { slug, blocks: [], metadata: meta ?? null }
}

describe('buildJsonLd', () => {
  it('uses Person schema on home when clientId suggests a personal site', () => {
    const schema = buildJsonLd(
      cfg({ clientId: 'alex-portfolio', siteMetadata: { siteName: 'Alex' } }),
      page('', { description: 'Designer for hire' }),
    )
    expect(schema['@type']).toBe('Person')
    expect(schema).toMatchObject({
      name: 'Alex',
      url: 'https://acme.example/',
      description: 'Designer for hire',
    })
  })

  it('uses Organization schema on home for generic clients', () => {
    const schema = buildJsonLd(
      cfg({}),
      page('', { description: 'We build widgets.' }),
    )
    expect(schema['@type']).toBe('Organization')
    expect(schema).toMatchObject({
      name: 'Acme Corp',
      url: 'https://acme.example/',
      description: 'We build widgets.',
    })
  })

  it.each([
    ['contact'],
    ['contacto'],
    ['get-in-contact'],
  ] as const)('uses ContactPage for slug %s', (slug) => {
    const schema = buildJsonLd(
      cfg({}),
      page(slug, { title: 'Reach us', description: 'Contact meta' }),
    )
    expect(schema['@type']).toBe('ContactPage')
    expect(schema).toMatchObject({
      url: `https://acme.example/${slug}`,
      isPartOf: { '@type': 'WebSite', name: 'Acme Corp', url: 'https://acme.example/' },
      description: 'Contact meta',
    })
    expect(schema.name).toContain('Reach us')
    expect(schema.name).toContain('Acme Corp')
  })

  it('uses WebPage for inner pages with a composed title', () => {
    const schema = buildJsonLd(
      cfg({ siteMetadata: { siteName: 'Brand' } }),
      page('about', { title: 'About' }),
    )
    expect(schema['@type']).toBe('WebPage')
    expect(schema.name).toBe('About | Brand')
  })

  it('falls back to displayName for page title when metadata title is absent', () => {
    const schema = buildJsonLd(cfg({ displayName: 'Only Name' }), page('about'))
    expect(schema['@type']).toBe('WebPage')
    expect(schema.name).toBe('Only Name')
  })

  it('prefers page description, then site defaultDescription', () => {
    const withPageDesc = buildJsonLd(
      cfg({ siteMetadata: { defaultDescription: 'Default blurb' } }),
      page('about', { description: 'About-specific' }),
    )
    expect(withPageDesc).toMatchObject({ description: 'About-specific' })

    const withDefaultOnly = buildJsonLd(
      cfg({ siteMetadata: { defaultDescription: 'Default blurb' } }),
      page('about'),
    )
    expect(withDefaultOnly).toMatchObject({ description: 'Default blurb' })
  })

  it.each([
    [
      'Person home page',
      cfg({ clientId: 'studio-person' }),
      page(''),
      'Person',
    ],
    ['Organization home page', cfg({}), page(''), 'Organization'],
    [
      'Contact page',
      cfg({}),
      page('contact'),
      'ContactPage',
    ],
  ] as const)(
    'omits description on %s when none is provided',
    (_label, config, pg, typeTag) => {
      const schema = buildJsonLd(config, pg)
      expect(schema['@type']).toBe(typeTag)
      expect('description' in schema && schema.description).toBeFalsy()
    },
  )

  it('supports customDomain values with protocol and trailing slash', () => {
    const schema = buildJsonLd(
      cfg({ customDomain: 'https://cdn.example/' }),
      page('hello'),
    )
    expect(schema.url).toBe('https://cdn.example/hello')
  })
})
