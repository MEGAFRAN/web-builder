# Task 03: CMS Types

**Plan:** Multi-Tenant SSG Platform  
**Depends on:** Task 01 (test infrastructure installed)  
**Goal:** Define the TypeScript discriminated union for all CMS block types and the `ClientConfig` shape that every part of the app depends on. This is the single source of truth for types — all subsequent tasks import from here.

**Files:**
- Create: `types/cms.ts`
- Create: `__tests__/types/cms.test.ts`

---

- [ ] **Step 1: Write a failing test that exercises the discriminated union**

Create `__tests__/types/cms.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test __tests__/types/cms.test.ts
```

Expected: FAIL — `Cannot find module '@/types/cms'`.

- [ ] **Step 3: Create `types/cms.ts`**

```typescript
// Primitive building blocks
export type CTA = { label: string; href: string }
export type Service = { title: string; description: string; icon?: string }

// Block types — each has a unique `_type` literal for exhaustive narrowing
export type HeroBlock = {
  _type: 'hero'
  title: string
  subtitle?: string
  cta?: CTA
}

export type ServicesBlock = {
  _type: 'services'
  items: Service[]
}

export type ContactBlock = {
  _type: 'contact'
  showMap: boolean
  phone?: string
  email?: string
  address?: string
}

export type BlogListBlock = {
  _type: 'blog_list'
  postsPerPage: number
}

export type Block = HeroBlock | ServicesBlock | ContactBlock | BlogListBlock

// Client config types
export type ClientTheme = {
  primaryColor: string
  accentColor: string
  backgroundColor: string
  fontHeading: string
  fontBody: string
  borderRadius: number
}

export type ClientFeatures = {
  blog: boolean
  booking: boolean
  gallery: boolean
  menu: boolean
}

export type ClientConfig = {
  clientId: string
  displayName: string
  sanityDataset: string
  customDomain: string
  swaResourceName: string
  features: ClientFeatures
  theme: ClientTheme
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test __tests__/types/cms.test.ts
```

Expected: `2 passed`.

- [ ] **Step 5: Commit**

```bash
git add types/cms.ts __tests__/types/cms.test.ts
git commit -m "feat: add CMS and ClientConfig TypeScript types"
```
