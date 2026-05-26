import type { ClientPage } from '@/types/cms'

export function createJSONCMSClient(pages: ClientPage[]) {
  return {
    async getPages(): Promise<{ slug: string }[]> {
      return pages.map((p) => ({ slug: p.slug }))
    },

    async getPage(slug: string): Promise<ClientPage | null> {
      return pages.find((p) => p.slug === slug) ?? null
    },

    imageUrl(source: string): string {
      return source
    },
  }
}
