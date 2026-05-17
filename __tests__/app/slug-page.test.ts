// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

beforeEach(() => {
  process.env.CLIENT_ID = 'restaurante-pepe'
  vi.resetModules()
})

vi.mock('@/lib/client-config', () => ({
  getClientConfig: vi.fn(() => ({
    clientId: 'restaurante-pepe',
    displayName: 'Restaurante Pepe',
    customDomain: 'restaurante-pepe.com',
    swaResourceName: 'swa-restaurante-pepe',
    features: { blog: false, booking: true, gallery: true, menu: true },
    theme: {
      primaryColor: '#c0392b', accentColor: '#e74c3c', backgroundColor: '#fdf8f2',
      fontHeading: 'Playfair Display', fontBody: 'Inter', borderRadius: 4,
    },
    pages: [],
  })),
}))

vi.mock('@/lib/json-cms', () => ({
  createJSONCMSClient: vi.fn(() => ({
    getPages: vi.fn().mockResolvedValue([
      { slug: '' },
      { slug: 'about' },
      { slug: 'menu' },
      { slug: 'contacto' },
    ]),
    getPage: vi.fn().mockResolvedValue({
      slug: 'about',
      blocks: [{ _type: 'hero', title: 'About' }],
    }),
  })),
}))

describe('generateStaticParams', () => {
  it('maps page slugs to param arrays', async () => {
    const { generateStaticParams } = await import('@/app/(site)/[[...slug]]/page')
    const params = await generateStaticParams()

    expect(params).toContainEqual({ slug: [] })
    expect(params).toContainEqual({ slug: ['about'] })
    expect(params).toContainEqual({ slug: ['menu'] })
    expect(params).toContainEqual({ slug: ['contacto'] })
    expect(params).toHaveLength(4)
  })
})
