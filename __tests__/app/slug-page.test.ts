// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

beforeEach(() => {
  process.env.CLIENT_ID = 'restaurante-pepe'
  process.env.SANITY_PROJECT_ID = 'testproject'
  vi.resetModules()
})

vi.mock('@/lib/client-config', () => ({
  getClientConfig: vi.fn(() => ({
    clientId: 'restaurante-pepe',
    sanityDataset: 'restaurante-pepe-prod',
    displayName: 'Restaurante Pepe',
    customDomain: 'restaurante-pepe.com',
    swaResourceName: 'swa-restaurante-pepe',
    features: { blog: false, booking: true, gallery: true, menu: true },
    theme: {
      primaryColor: '#c0392b', accentColor: '#e74c3c', backgroundColor: '#fdf8f2',
      fontHeading: 'Playfair Display', fontBody: 'Inter', borderRadius: 4,
    },
  })),
}))

vi.mock('@/lib/cms', () => ({
  createCMSClient: vi.fn(() => ({
    getPages: vi.fn().mockResolvedValue([
      { slug: '' },
      { slug: 'about' },
      { slug: 'menu' },
      { slug: 'contacto' },
    ]),
    getPage: vi.fn().mockResolvedValue({
      slug: { current: 'about' },
      blocks: [{ _type: 'hero', title: 'About' }],
    }),
  })),
}))

describe('generateStaticParams', () => {
  it('maps page slugs to param arrays', async () => {
    const { generateStaticParams } = await import('@/app/[[...slug]]/page')
    const params = await generateStaticParams()

    expect(params).toContainEqual({ slug: [] })
    expect(params).toContainEqual({ slug: ['about'] })
    expect(params).toContainEqual({ slug: ['menu'] })
    expect(params).toContainEqual({ slug: ['contacto'] })
    expect(params).toHaveLength(4)
  })
})
