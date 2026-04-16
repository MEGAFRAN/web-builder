import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { JsonLdScript } from '@/components/seo/JsonLdScript'
import type { JsonLdSchema } from '@/lib/json-ld'

// ─── Schema fixtures ──────────────────────────────────────────────────────────

const webPageSchema: JsonLdSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'About Us | Acme Corp',
  description: 'Learn more about Acme Corp',
  url: 'https://acme.com/about',
  isPartOf: { '@type': 'WebSite', name: 'Acme Corp', url: 'https://acme.com/' },
}

const contactPageSchema: JsonLdSchema = {
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  name: 'Contact | Acme Corp',
  url: 'https://acme.com/contact',
  isPartOf: { '@type': 'WebSite', name: 'Acme Corp', url: 'https://acme.com/' },
}

const organizationSchema: JsonLdSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Acme Corp',
  url: 'https://acme.com/',
  sameAs: ['https://twitter.com/acme', 'https://linkedin.com/company/acme'],
}

const personSchema: JsonLdSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Jane Doe',
  description: 'Freelance designer and developer',
  url: 'https://janedoe.com/',
  sameAs: ['https://github.com/janedoe'],
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function renderScript(schema: JsonLdSchema) {
  const { container } = render(<JsonLdScript schema={schema} />)
  return container.querySelector('script[type="application/ld+json"]')
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('JsonLdScript', () => {
  describe('script tag attributes', () => {
    it('renders a <script> element', () => {
      const script = renderScript(webPageSchema)
      expect(script).not.toBeNull()
    })

    it('sets type="application/ld+json" on the script tag', () => {
      const script = renderScript(webPageSchema)
      expect(script?.getAttribute('type')).toBe('application/ld+json')
    })
  })

  describe('JSON serialization', () => {
    it.each([
      ['WebPage schema', webPageSchema],
      ['ContactPage schema', contactPageSchema],
      ['Organization schema', organizationSchema],
      ['Person schema', personSchema],
    ] as const)('serializes %s to valid JSON in innerHTML', (_label, schema) => {
      const script = renderScript(schema)
      const parsed = JSON.parse(script?.innerHTML ?? '')
      expect(parsed).toEqual(schema)
    })

    it('preserves @context and @type fields', () => {
      const script = renderScript(organizationSchema)
      const parsed = JSON.parse(script?.innerHTML ?? '')
      expect(parsed['@context']).toBe('https://schema.org')
      expect(parsed['@type']).toBe('Organization')
    })

    it('preserves optional description when present', () => {
      const script = renderScript(personSchema)
      const parsed = JSON.parse(script?.innerHTML ?? '')
      expect(parsed.description).toBe('Freelance designer and developer')
    })

    it('preserves sameAs array with multiple entries', () => {
      const script = renderScript(organizationSchema)
      const parsed = JSON.parse(script?.innerHTML ?? '')
      expect(parsed.sameAs).toEqual([
        'https://twitter.com/acme',
        'https://linkedin.com/company/acme',
      ])
    })

    it('preserves nested isPartOf object', () => {
      const script = renderScript(webPageSchema)
      const parsed = JSON.parse(script?.innerHTML ?? '')
      expect(parsed.isPartOf).toEqual({
        '@type': 'WebSite',
        name: 'Acme Corp',
        url: 'https://acme.com/',
      })
    })
  })

  describe('edge cases', () => {
    it('handles special characters in string values without breaking JSON', () => {
      const schema: JsonLdSchema = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Café & "Bistro" — <Special> Chars',
        url: 'https://example.com/cafe',
        isPartOf: { '@type': 'WebSite', name: 'Example', url: 'https://example.com/' },
      }
      const script = renderScript(schema)
      const parsed = JSON.parse(script?.innerHTML ?? '')
      expect(parsed.name).toBe('Café & "Bistro" — <Special> Chars')
    })

    it('handles deeply nested objects in the schema', () => {
      // JsonLdSchema is a union type; cast to Organization and add extra fields
      // via a wider type to simulate a deeply-nested payload surviving stringify.
      const deepSchema = {
        '@context': 'https://schema.org' as const,
        '@type': 'Organization' as const,
        name: 'Deep Co',
        url: 'https://deep.co/',
        address: {
          '@type': 'PostalAddress',
          streetAddress: '123 Main St',
          addressLocality: 'Springfield',
          nested: { level2: { level3: 'value' } },
        },
      } as unknown as JsonLdSchema

      const script = renderScript(deepSchema)
      const parsed = JSON.parse(script?.innerHTML ?? '')
      expect(parsed.address.nested.level2.level3).toBe('value')
    })

    it('handles an array of sameAs URLs', () => {
      const schema: JsonLdSchema = {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: 'Multi Link',
        url: 'https://multi.io/',
        sameAs: [
          'https://twitter.com/multi',
          'https://github.com/multi',
          'https://linkedin.com/in/multi',
        ],
      }
      const script = renderScript(schema)
      const parsed = JSON.parse(script?.innerHTML ?? '')
      expect(parsed.sameAs).toHaveLength(3)
      expect(parsed.sameAs[2]).toBe('https://linkedin.com/in/multi')
    })

    it('handles a schema without optional fields (no description, no sameAs)', () => {
      const schema: JsonLdSchema = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Minimal Page',
        url: 'https://example.com/minimal',
        isPartOf: { '@type': 'WebSite', name: 'Example', url: 'https://example.com/' },
      }
      const script = renderScript(schema)
      const parsed = JSON.parse(script?.innerHTML ?? '')
      expect(parsed.description).toBeUndefined()
      expect(parsed.sameAs).toBeUndefined()
    })
  })
})
