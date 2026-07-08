import type { MetadataRoute } from 'next'
import { getClientConfig } from '@/lib/client-config'
import { buildSitemapFromConfig } from '@/lib/site-seo'

export default function sitemap(): MetadataRoute.Sitemap {
  const config = getClientConfig(process.env.CLIENT_ID!)
  const trailingSlash = process.env.DEPLOY_TARGET === 'blob'

  return buildSitemapFromConfig(config, trailingSlash)
}
