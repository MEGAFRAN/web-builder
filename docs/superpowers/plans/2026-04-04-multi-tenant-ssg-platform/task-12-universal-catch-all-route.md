# Task 12: Universal Catch-All Route

**Plan:** Multi-Tenant SSG Platform  
**Depends on:** Task 04 (`lib/client-config.ts`), Task 05 (`lib/cms.ts`), Task 10 (`components/PageRenderer.tsx`)  
**Goal:** Create the `app/[[...slug]]/page.tsx` optional catch-all route that serves every page for the active client. `generateStaticParams` fetches all page slugs from Sanity at build time. The root path `/` maps to `slug = []`. Delete the default `app/page.tsx` — all routes are now CMS-driven.

**Files:**
- Create: `app/[[...slug]]/page.tsx`
- Delete: `app/page.tsx`
- Create: `__tests__/app/slug-page.test.ts`

---

- [ ] **Step 1: Write a failing test for `generateStaticParams`**

Create `__tests__/app/slug-page.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test __tests__/app/slug-page.test.ts
```

Expected: FAIL — `Cannot find module '@/app/[[...slug]]/page'`.

- [ ] **Step 3: Create `app/[[...slug]]/page.tsx`**

```typescript
import { createCMSClient } from '@/lib/cms'
import { getClientConfig } from '@/lib/client-config'
import PageRenderer from '@/components/PageRenderer'
import { notFound } from 'next/navigation'

export async function generateStaticParams() {
  const clientId = process.env.CLIENT_ID!
  const config = getClientConfig(clientId)
  const cms = createCMSClient(config.sanityDataset)
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
  const cms = createCMSClient(config.sanityDataset)

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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test __tests__/app/slug-page.test.ts
```

Expected: `1 passed`.

- [ ] **Step 5: Delete `app/page.tsx`**

```bash
rm app/page.tsx
```

The root `/` is now served by the optional catch-all with `slug = []`.

- [ ] **Step 6: Run all tests to confirm nothing broke**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add "app/[[...slug]]/page.tsx" __tests__/app/slug-page.test.ts
git rm app/page.tsx
git commit -m "feat: add universal catch-all route — all pages served by [[...slug]]"
```
