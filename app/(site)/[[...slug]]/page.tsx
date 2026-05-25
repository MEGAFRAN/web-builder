import { createJSONCMSClient } from '@/lib/json-cms'
import { getClientConfig } from '@/lib/client-config'
import { getCompanyProfile } from '@/lib/company-profile'
import { buildJsonLd } from '@/lib/json-ld'
import { findHomepageHeroBackgroundImageUrl } from '@/lib/page-hero-preload'
import PageRenderer from '@/components/PageRenderer'
import { JsonLdScript } from '@/components/seo/JsonLdScript'
import { HeroImagePreload } from '@/components/seo/HeroImagePreload'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export async function generateStaticParams() {
  const clientId = process.env.CLIENT_ID!
  const config = getClientConfig(clientId)
  const cms = createJSONCMSClient(config.pages)
  const pages = await cms.getPages()

  return pages.map((p) => ({
    slug: p.slug === '' ? [] : p.slug.split('/'),
  }))
}

interface PageProps {
  params: Promise<{ slug?: string[] }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const clientId = process.env.CLIENT_ID!
  const config = getClientConfig(clientId)
  const cms = createJSONCMSClient(config.pages)
  const page = await cms.getPage(slug ? slug.join('/') : '')

  const site = config.siteMetadata
  const pageMeta = page?.metadata

  const title = pageMeta?.title
    ? (site?.titleTemplate?.replace('%s', pageMeta.title) ?? pageMeta.title)
    : (site?.siteName ?? config.displayName)

  const description = pageMeta?.description ?? site?.defaultDescription ?? null
  const ogImage = pageMeta?.ogImage ?? site?.defaultOgImage ?? null

  return {
    title,
    ...(description && { description }),
    ...(ogImage && {
      openGraph: {
        title,
        ...(description && { description }),
        images: [ogImage],
      },
    }),
    ...(pageMeta?.noIndex && { robots: 'noindex' }),
  }
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params
  const clientId = process.env.CLIENT_ID!
  const config = getClientConfig(clientId)
  const cms = createJSONCMSClient(config.pages)

  const slugString = slug ? slug.join('/') : ''
  const page = await cms.getPage(slugString)

  if (!page) {
    notFound()
  }

  const profile = await getCompanyProfile(clientId)
  const schema = buildJsonLd(config, page, profile)
  const heroBackgroundImageUrl = findHomepageHeroBackgroundImageUrl(page.blocks)

  return (
    <>
      {heroBackgroundImageUrl && <HeroImagePreload href={heroBackgroundImageUrl} />}
      <JsonLdScript schema={schema} />
      <main>
        <PageRenderer blocks={page.blocks} companyProfile={profile} />
      </main>
    </>
  )
}
