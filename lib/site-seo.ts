import type { MetadataRoute } from 'next'
import type { ClientConfig, ClientPage } from '@/types/cms'

export function getSiteBaseUrl(customDomain: string): string {
  return `https://${customDomain}`
}

export function buildPageUrl(baseUrl: string, slug: string, trailingSlash: boolean): string {
  const path = slug === '' ? '' : `/${slug}`
  return trailingSlash ? `${baseUrl}${path}/` : `${baseUrl}${path}`
}

export function buildRobotsConfig(customDomain: string): MetadataRoute.Robots {
  const baseUrl = getSiteBaseUrl(customDomain)

  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}

export function buildSitemapEntries(
  pages: ClientPage[],
  customDomain: string,
  trailingSlash: boolean,
): MetadataRoute.Sitemap {
  const baseUrl = getSiteBaseUrl(customDomain)

  return pages
    .filter((page) => !page.metadata?.noIndex)
    .map((page) => ({
      url: buildPageUrl(baseUrl, page.slug, trailingSlash),
      lastModified: new Date(),
      changeFrequency: (page.slug === '' ? 'weekly' : 'monthly') as MetadataRoute.Sitemap[number]['changeFrequency'],
      priority: page.slug === '' ? 1.0 : 0.8,
    }))
}

export function buildSitemapFromConfig(
  config: ClientConfig,
  trailingSlash: boolean,
): MetadataRoute.Sitemap {
  return buildSitemapEntries(config.pages, config.customDomain, trailingSlash)
}
