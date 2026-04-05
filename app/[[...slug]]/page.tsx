import { createJSONCMSClient } from '@/lib/json-cms'
import { getClientConfig } from '@/lib/client-config'
import PageRenderer from '@/components/PageRenderer'
import { notFound } from 'next/navigation'

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

  return (
    <main>
      <PageRenderer blocks={page.blocks} />
    </main>
  )
}
