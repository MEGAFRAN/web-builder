import type { MetadataRoute } from 'next'
import { getClientConfig } from '@/lib/client-config'
import { buildRobotsConfig } from '@/lib/site-seo'

export default function robots(): MetadataRoute.Robots {
  const config = getClientConfig(process.env.CLIENT_ID!)
  return buildRobotsConfig(config.customDomain)
}
