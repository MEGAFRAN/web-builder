/**
 * JSON-LD structured data builder.
 *
 * Produces schema.org objects for each page type so search engines can
 * understand the site content. Values are pulled entirely from ClientConfig
 * and page-level metadata — nothing is hardcoded per client.
 *
 * Schema type mapping:
 *   - home slug ("")          → Person  (if clientId contains "portfolio" or "person")
 *                                Organization  (all other home pages)
 *   - slug contains "contact" → ContactPage
 *   - all other slugs         → WebPage
 */

import type { ClientConfig, ClientPage } from '@/types/cms'

// ─── Canonical URL helper ────────────────────────────────────────────────────

function canonicalUrl(domain: string, slug: string): string {
  const base = domain.startsWith('http') ? domain : `https://${domain}`
  const trimmed = base.replace(/\/$/, '')
  return slug === '' ? trimmed + '/' : `${trimmed}/${slug}`
}

// ─── Schema.org object shapes (typed just enough for safe serialization) ─────

type SchemaWebPage = {
  '@context': 'https://schema.org'
  '@type': 'WebPage'
  name: string
  description?: string
  url: string
  isPartOf: { '@type': 'WebSite'; name: string; url: string }
}

type SchemaContactPage = {
  '@context': 'https://schema.org'
  '@type': 'ContactPage'
  name: string
  description?: string
  url: string
  isPartOf: { '@type': 'WebSite'; name: string; url: string }
}

type SchemaPerson = {
  '@context': 'https://schema.org'
  '@type': 'Person'
  name: string
  description?: string
  url: string
  sameAs?: string[]
}

type SchemaOrganization = {
  '@context': 'https://schema.org'
  '@type': 'Organization'
  name: string
  description?: string
  url: string
  sameAs?: string[]
}

export type JsonLdSchema =
  | SchemaWebPage
  | SchemaContactPage
  | SchemaPerson
  | SchemaOrganization

// ─── Page-type detection ─────────────────────────────────────────────────────

function isPersonSite(clientId: string): boolean {
  const lower = clientId.toLowerCase()
  return lower.includes('portfolio') || lower.includes('person') || lower.includes('freelance')
}

function isContactSlug(slug: string): boolean {
  const lower = slug.toLowerCase()
  return lower === 'contact' || lower === 'contacto' || lower.includes('contact')
}

// ─── Schema builders ─────────────────────────────────────────────────────────

function buildWebSitePartOf(
  siteName: string,
  siteUrl: string
): { '@type': 'WebSite'; name: string; url: string } {
  return { '@type': 'WebSite', name: siteName, url: siteUrl }
}

function buildHomePage(config: ClientConfig, description: string | null): JsonLdSchema {
  const siteUrl = canonicalUrl(config.customDomain, '')
  const name = config.siteMetadata?.siteName ?? config.displayName

  if (isPersonSite(config.clientId)) {
    const schema: SchemaPerson = {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name,
      url: siteUrl,
    }
    if (description) schema.description = description
    return schema
  }

  const schema: SchemaOrganization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url: siteUrl,
  }
  if (description) schema.description = description
  return schema
}

function buildContactPage(
  config: ClientConfig,
  page: ClientPage,
  description: string | null
): SchemaContactPage {
  const siteUrl = canonicalUrl(config.customDomain, '')
  const pageUrl = canonicalUrl(config.customDomain, page.slug)
  const siteName = config.siteMetadata?.siteName ?? config.displayName
  const pageName = page.metadata?.title
    ? `${page.metadata.title} | ${siteName}`
    : siteName

  const schema: SchemaContactPage = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: pageName,
    url: pageUrl,
    isPartOf: buildWebSitePartOf(siteName, siteUrl),
  }
  if (description) schema.description = description
  return schema
}

function buildWebPage(
  config: ClientConfig,
  page: ClientPage,
  description: string | null
): SchemaWebPage {
  const siteUrl = canonicalUrl(config.customDomain, '')
  const pageUrl = canonicalUrl(config.customDomain, page.slug)
  const siteName = config.siteMetadata?.siteName ?? config.displayName
  const pageName = page.metadata?.title
    ? `${page.metadata.title} | ${siteName}`
    : siteName

  const schema: SchemaWebPage = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: pageName,
    url: pageUrl,
    isPartOf: buildWebSitePartOf(siteName, siteUrl),
  }
  if (description) schema.description = description
  return schema
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Returns the appropriate schema.org object for a given page.
 *
 * @param config  The fully-loaded ClientConfig for the current build target.
 * @param page    The ClientPage being rendered (slug + blocks + metadata).
 * @returns       A JSON-LD schema object ready to be serialized into a <script> tag.
 */
export function buildJsonLd(config: ClientConfig, page: ClientPage): JsonLdSchema {
  const description =
    page.metadata?.description ??
    config.siteMetadata?.defaultDescription ??
    null

  if (page.slug === '') {
    return buildHomePage(config, description)
  }

  if (isContactSlug(page.slug)) {
    return buildContactPage(config, page, description)
  }

  return buildWebPage(config, page, description)
}
