import { describe, it, expect } from 'vitest'
import { createJSONCMSClient } from '@/lib/json-cms'
import type { ClientPage } from '@/types/cms'

const pages: ClientPage[] = [
  { slug: '', blocks: [] },
  { slug: 'about', blocks: [] },
  { slug: 'contact', blocks: [] },
]

describe('createJSONCMSClient', () => {
  it('getPages returns slug list in order', async () => {
    const client = createJSONCMSClient(pages)
    await expect(client.getPages()).resolves.toEqual([
      { slug: '' },
      { slug: 'about' },
      { slug: 'contact' },
    ])
  })

  it('getPage returns the matching ClientPage or null', async () => {
    const client = createJSONCMSClient(pages)
    await expect(client.getPage('about')).resolves.toEqual(pages[1])
    await expect(client.getPage('missing')).resolves.toBeNull()
  })

  it('imageUrl returns the source unchanged', () => {
    const client = createJSONCMSClient(pages)
    expect(client.imageUrl('/photo.jpg')).toBe('/photo.jpg')
  })
})
