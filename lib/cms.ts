import { createClient } from '@sanity/client'
import { createImageUrlBuilder } from '@sanity/image-url'
import type { Block } from '@/types/cms'

type SanityPageSlug = { slug: { current: string } }
type SanityPage = { slug: { current: string }; blocks: Block[] }

export function createCMSClient(projectId: string, dataset: string) {
  const client = createClient({
    projectId,
    dataset,
    apiVersion: '2024-01-01',
    useCdn: true,
  })

  const builder = createImageUrlBuilder(client)

  return {
    async getPages(): Promise<{ slug: string }[]> {
      const pages: SanityPageSlug[] = await client.fetch(`*[_type == "page"]{ slug }`)
      return pages.map((p) => ({ slug: p.slug.current }))
    },

    async getPage(slug: string): Promise<SanityPage | null> {
      return client.fetch(
        `*[_type == "page" && slug.current == $slug][0]{ slug, blocks[]{ _type, ... } }`,
        { slug }
      )
    },

    imageUrl(source: string) {
      return builder.image(source)
    },
  }
}
