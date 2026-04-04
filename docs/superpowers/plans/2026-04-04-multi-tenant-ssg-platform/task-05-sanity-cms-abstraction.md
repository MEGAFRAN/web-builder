# Task 05: Sanity CMS Abstraction

**Plan:** Multi-Tenant SSG Platform  
**Depends on:** Task 03 (`types/cms.ts` must exist)  
**Goal:** Create `lib/cms.ts` — a factory that wraps `@sanity/client` with typed `getPages` and `getPage` functions. Each call to `createCMSClient(dataset)` targets one client's Sanity dataset.

**Files:**
- Create: `lib/cms.ts`
- Create: `__tests__/lib/cms.test.ts`

---

- [ ] **Step 1: Write failing tests for the CMS client**

Create `__tests__/lib/cms.test.ts`:

```typescript
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock @sanity/client before any import of lib/cms
vi.mock('@sanity/client', () => ({
  createClient: vi.fn(() => ({
    fetch: vi.fn(),
  })),
}))

vi.mock('@sanity/image-url', () => ({
  default: vi.fn(() => ({
    image: vi.fn(() => ({ url: vi.fn(() => 'https://cdn.sanity.io/test') })),
  })),
}))

import { createClient } from '@sanity/client'
import { createCMSClient } from '@/lib/cms'

describe('createCMSClient', () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.resetModules()
    process.env.SANITY_PROJECT_ID = 'testproject'
    mockFetch = vi.fn()
    vi.mocked(createClient).mockReturnValue({ fetch: mockFetch } as any)
  })

  describe('getPages', () => {
    it('returns slugs from Sanity pages', async () => {
      mockFetch.mockResolvedValue([
        { slug: { current: 'home' } },
        { slug: { current: 'about' } },
        { slug: { current: 'menu' } },
      ])

      const cms = createCMSClient('restaurante-pepe-prod')
      const pages = await cms.getPages()

      expect(pages).toEqual([
        { slug: 'home' },
        { slug: 'about' },
        { slug: 'menu' },
      ])
    })

    it('returns empty array when no pages exist', async () => {
      mockFetch.mockResolvedValue([])
      const cms = createCMSClient('restaurante-pepe-prod')
      expect(await cms.getPages()).toEqual([])
    })
  })

  describe('getPage', () => {
    it('returns page with blocks', async () => {
      mockFetch.mockResolvedValue({
        slug: { current: 'about' },
        blocks: [
          { _type: 'hero', title: 'About Us' },
          { _type: 'contact', showMap: false, phone: '123456789' },
        ],
      })

      const cms = createCMSClient('restaurante-pepe-prod')
      const page = await cms.getPage('about')

      expect(page?.blocks[0]._type).toBe('hero')
      expect(page?.blocks[1]._type).toBe('contact')
    })

    it('returns null when page is not found', async () => {
      mockFetch.mockResolvedValue(null)
      const cms = createCMSClient('restaurante-pepe-prod')
      expect(await cms.getPage('nonexistent')).toBeNull()
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test __tests__/lib/cms.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/cms'`.

- [ ] **Step 3: Create `lib/cms.ts`**

```typescript
import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'
import type { Block } from '@/types/cms'

type SanityPageSlug = { slug: { current: string } }
type SanityPage = { slug: { current: string }; blocks: Block[] }

export function createCMSClient(dataset: string) {
  const client = createClient({
    projectId: process.env.SANITY_PROJECT_ID!,
    dataset,
    apiVersion: '2024-01-01',
    useCdn: true,
  })

  const builder = imageUrlBuilder(client)

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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test __tests__/lib/cms.test.ts
```

Expected: `4 passed`.

- [ ] **Step 5: Commit**

```bash
git add lib/cms.ts __tests__/lib/cms.test.ts
git commit -m "feat: add Sanity CMS abstraction with getPages and getPage"
```
