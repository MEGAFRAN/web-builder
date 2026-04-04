// @vitest-environment node
import { describe, it, expect, expectTypeOf } from 'vitest'
import type { Block, ClientConfig, HeroBlock } from '@/types/cms'

describe('Block discriminated union', () => {
  it('HeroBlock has _type hero', () => {
    const block: HeroBlock = { _type: 'hero', title: 'Welcome' }
    expectTypeOf(block._type).toEqualTypeOf<'hero'>()
  })

  it('narrows correctly in a switch', () => {
    function getTitle(block: Block): string | null {
      switch (block._type) {
        case 'hero': return block.title
        default: return null
      }
    }

    const hero: Block = { _type: 'hero', title: 'Hello' }
    expect(getTitle(hero)).toBe('Hello')
  })
})

describe('ClientConfig', () => {
  it('has required fields', () => {
    const config: ClientConfig = {
      clientId: 'test',
      displayName: 'Test Client',
      sanityProjectId: 'abc123',
      sanityDataset: 'test-prod',
      customDomain: 'test.com',
      swaResourceName: 'swa-test',
      features: { blog: false, booking: true, gallery: false, menu: true },
      theme: {
        primaryColor: '#ff0000',
        accentColor: '#00ff00',
        backgroundColor: '#ffffff',
        fontHeading: 'Playfair Display',
        fontBody: 'Inter',
        borderRadius: 8,
      },
    }
    expectTypeOf(config.clientId).toEqualTypeOf<string>()
  })
})
