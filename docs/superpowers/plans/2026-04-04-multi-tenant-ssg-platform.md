# Multi-Tenant SSG Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a multi-tenant Next.js SSG platform where a single codebase builds isolated static sites for 100+ clients, each driven by Sanity CMS and deployed independently to Azure Static Web Apps.

**Architecture:** A `CLIENT_ID` environment variable gates every build to one client, reading that client's config JSON to connect to their dedicated Sanity dataset and inject their theme. An optional catch-all route `app/[[...slug]]/page.tsx` fetches all pages from Sanity at build time and dispatches rendering to typed block components.

**Tech Stack:** Next.js 16 (App Router, `output: 'export'`), TypeScript strict, Sanity (`@sanity/client` + `@sanity/image-url`), Tailwind CSS v4, Vitest + React Testing Library, GitHub Actions, Azure Static Web Apps.

---

## File Map

| File | Responsibility |
|---|---|
| `next.config.ts` | Enable `output: 'export'` + wire Sanity image loader |
| `lib/sanity-image-loader.ts` | `next/image` custom loader that resolves Sanity asset references to CDN URLs |
| `types/cms.ts` | Discriminated union `Block` type + `ClientConfig` / `ClientTheme` types |
| `lib/client-config.ts` | Synchronously read `config/clients/<id>.json` using `CLIENT_ID` env var |
| `config/clients/restaurante-pepe.json` | Example client config (restaurant) |
| `config/clients/peluqueria-ana.json` | Example client config (hair salon) |
| `lib/cms.ts` | Factory `createCMSClient(dataset)` that wraps Sanity with `getPages` + `getPage` |
| `components/blocks/HeroBlock.tsx` | Hero section — title, subtitle, optional CTA button |
| `components/blocks/ServicesBlock.tsx` | Services grid — array of service cards |
| `components/blocks/ContactBlock.tsx` | Contact info — phone, email, address, optional map flag |
| `components/blocks/BlogListBlock.tsx` | Blog list stub — paginated post grid |
| `components/PageRenderer.tsx` | Switch-based block dispatcher — renders the right component per `_type` |
| `app/globals.css` | Semantic utility classes using CSS variables (`.btn-primary`, `.text-brand`, etc.) |
| `app/layout.tsx` | Root layout — reads client config, injects `<style>` with CSS variable theme |
| `app/[[...slug]]/page.tsx` | Universal catch-all — `generateStaticParams` + page fetch + `PageRenderer` |
| `app/page.tsx` | **DELETE** — replaced by optional catch-all (root `/` is handled by `[[...slug]]`) |
| `.github/workflows/deploy-client.yml` | Per-client isolated build + Azure SWA deploy triggered by webhook |
| `vitest.config.ts` | Vitest config with jsdom + React plugin + `@` path alias |
| `vitest.setup.ts` | Import `@testing-library/jest-dom` matchers |

---

## Task 1: Test Infrastructure

**Files:**
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Modify: `package.json` (add test script + devDependencies)

- [ ] **Step 1: Install test dependencies and Sanity packages**

```bash
npm install @sanity/client @sanity/image-url
npm install --save-dev vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom
```

Expected: No errors. `package.json` now lists all packages.

- [ ] **Step 2: Write a smoke test that imports React**

Create `__tests__/smoke.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

function Smoke() {
  return <p>ok</p>
}

describe('smoke', () => {
  it('renders a React component', () => {
    render(<Smoke />)
    expect(screen.getByText('ok')).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Run test to confirm it fails (no vitest config yet)**

```bash
npx vitest run __tests__/smoke.test.tsx
```

Expected: Error — cannot find `vitest.config.ts` or similar module resolution failure.

- [ ] **Step 4: Create `vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
    },
  },
})
```

- [ ] **Step 5: Create `vitest.setup.ts`**

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 6: Add test script to `package.json`**

In the `"scripts"` section, add:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 7: Run smoke test to confirm it passes**

```bash
npm test
```

Expected: `1 passed`.

- [ ] **Step 8: Commit**

```bash
git add vitest.config.ts vitest.setup.ts __tests__/smoke.test.tsx package.json package-lock.json
git commit -m "chore: add Vitest + RTL + Sanity packages"
```

---

## Task 2: SSG Export Config + Sanity Image Loader

**Files:**
- Modify: `next.config.ts`
- Create: `lib/sanity-image-loader.ts`
- Create: `__tests__/lib/sanity-image-loader.test.ts`

- [ ] **Step 1: Write a failing test for the image loader**

Create `__tests__/lib/sanity-image-loader.test.ts`:

```typescript
// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest'

// Must set env vars before importing the module
beforeEach(() => {
  process.env.SANITY_PROJECT_ID = 'testproject'
  process.env.SANITY_DATASET = 'test-dataset'
  vi.resetModules()
})

describe('sanityImageLoader', () => {
  it('returns a URL containing the project ID, width, and quality', async () => {
    const { default: loader } = await import('@/lib/sanity-image-loader')
    const url = loader({ src: 'image-abc123def456-1920x1080-jpg', width: 800, quality: 80 })

    expect(url).toContain('testproject')
    expect(url).toContain('w=800')
  })

  it('uses quality 75 when quality is not provided', async () => {
    const { default: loader } = await import('@/lib/sanity-image-loader')
    const url = loader({ src: 'image-abc123def456-1920x1080-jpg', width: 400 })

    expect(url).toContain('q=75')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test __tests__/lib/sanity-image-loader.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/sanity-image-loader'`.

- [ ] **Step 3: Create `lib/sanity-image-loader.ts`**

```typescript
import imageUrlBuilder from '@sanity/image-url'
import { createClient } from '@sanity/client'
import type { ImageLoaderProps } from 'next/image'

const sanityClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID!,
  dataset: process.env.SANITY_DATASET!,
  apiVersion: '2024-01-01',
  useCdn: true,
})

const builder = imageUrlBuilder(sanityClient)

export default function sanityImageLoader({ src, width, quality }: ImageLoaderProps): string {
  return builder.image(src).width(width).quality(quality ?? 75).auto('format').url()
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test __tests__/lib/sanity-image-loader.test.ts
```

Expected: `2 passed`.

- [ ] **Step 5: Update `next.config.ts` to enable SSG export and wire the image loader**

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    loader: 'custom',
    loaderFile: './lib/sanity-image-loader.ts',
  },
}

export default nextConfig
```

- [ ] **Step 6: Commit**

```bash
git add next.config.ts lib/sanity-image-loader.ts __tests__/lib/sanity-image-loader.test.ts
git commit -m "feat: enable SSG export and Sanity image loader"
```

---

## Task 3: CMS Types

**Files:**
- Create: `types/cms.ts`
- Create: `__tests__/types/cms.test.ts`

- [ ] **Step 1: Write a failing test that exercises the discriminated union**

Create `__tests__/types/cms.test.ts`:

```typescript
// @vitest-environment node
import { describe, it, expectTypeOf } from 'vitest'
import type { Block, ClientConfig, HeroBlock, ServicesBlock } from '@/types/cms'

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
    // TypeScript would fail to compile if narrowing broke, so runtime check suffices
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

---

## Task 4: Client Config System

**Files:**
- Create: `lib/client-config.ts`
- Create: `config/clients/restaurante-pepe.json`
- Create: `config/clients/peluqueria-ana.json`
- Create: `__tests__/lib/client-config.test.ts`

- [ ] **Step 1: Write a failing test for `getClientConfig`**

Create `__tests__/lib/client-config.test.ts`:

```typescript
// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { getClientConfig } from '@/lib/client-config'

describe('getClientConfig', () => {
  it('loads and returns the config for restaurante-pepe', () => {
    const config = getClientConfig('restaurante-pepe')
    expect(config.clientId).toBe('restaurante-pepe')
    expect(config.displayName).toBe('Restaurante Pepe')
    expect(config.sanityDataset).toBe('restaurante-pepe-prod')
    expect(config.theme.primaryColor).toBe('#c0392b')
    expect(config.features.menu).toBe(true)
    expect(config.features.blog).toBe(false)
  })

  it('loads and returns the config for peluqueria-ana', () => {
    const config = getClientConfig('peluqueria-ana')
    expect(config.clientId).toBe('peluqueria-ana')
    expect(config.features.booking).toBe(true)
  })

  it('throws when clientId does not exist', () => {
    expect(() => getClientConfig('nonexistent-client')).toThrow()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test __tests__/lib/client-config.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/client-config'`.

- [ ] **Step 3: Create `config/clients/restaurante-pepe.json`**

```json
{
  "clientId": "restaurante-pepe",
  "displayName": "Restaurante Pepe",
  "sanityDataset": "restaurante-pepe-prod",
  "customDomain": "restaurante-pepe.com",
  "swaResourceName": "swa-restaurante-pepe",
  "features": {
    "blog": false,
    "booking": true,
    "gallery": true,
    "menu": true
  },
  "theme": {
    "primaryColor": "#c0392b",
    "accentColor": "#e74c3c",
    "backgroundColor": "#fdf8f2",
    "fontHeading": "Playfair Display",
    "fontBody": "Inter",
    "borderRadius": 4
  }
}
```

- [ ] **Step 4: Create `config/clients/peluqueria-ana.json`**

```json
{
  "clientId": "peluqueria-ana",
  "displayName": "Peluquería Ana",
  "sanityDataset": "peluqueria-ana-prod",
  "customDomain": "peluqueria-ana.com",
  "swaResourceName": "swa-peluqueria-ana",
  "features": {
    "blog": false,
    "booking": true,
    "gallery": true,
    "menu": false
  },
  "theme": {
    "primaryColor": "#8e44ad",
    "accentColor": "#9b59b6",
    "backgroundColor": "#fdf6ff",
    "fontHeading": "Cormorant Garamond",
    "fontBody": "Lato",
    "borderRadius": 24
  }
}
```

- [ ] **Step 5: Create `lib/client-config.ts`**

```typescript
import fs from 'fs'
import path from 'path'
import type { ClientConfig } from '@/types/cms'

export function getClientConfig(clientId: string): ClientConfig {
  const configPath = path.join(process.cwd(), 'config', 'clients', `${clientId}.json`)
  const raw = fs.readFileSync(configPath, 'utf-8')
  return JSON.parse(raw) as ClientConfig
}
```

- [ ] **Step 6: Run test to verify it passes**

```bash
npm test __tests__/lib/client-config.test.ts
```

Expected: `3 passed`.

- [ ] **Step 7: Commit**

```bash
git add lib/client-config.ts config/clients/restaurante-pepe.json config/clients/peluqueria-ana.json __tests__/lib/client-config.test.ts
git commit -m "feat: add client config loader and example client configs"
```

---

## Task 5: Sanity CMS Abstraction

**Files:**
- Create: `lib/cms.ts`
- Create: `__tests__/lib/cms.test.ts`

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
  default: vi.fn(() => ({ image: vi.fn(() => ({ url: vi.fn(() => 'https://cdn.sanity.io/test') })) })),
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

---

## Task 6: HeroBlock Component

**Files:**
- Create: `components/blocks/HeroBlock.tsx`
- Create: `__tests__/components/blocks/HeroBlock.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `__tests__/components/blocks/HeroBlock.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import HeroBlock from '@/components/blocks/HeroBlock'

describe('HeroBlock', () => {
  it('renders title and subtitle', () => {
    render(<HeroBlock _type="hero" title="Welcome to Pepe" subtitle="Best food in town" />)
    expect(screen.getByRole('heading', { name: 'Welcome to Pepe' })).toBeInTheDocument()
    expect(screen.getByText('Best food in town')).toBeInTheDocument()
  })

  it('renders CTA button when cta prop is provided', () => {
    render(
      <HeroBlock
        _type="hero"
        title="Hello"
        cta={{ label: 'Book a table', href: '/booking' }}
      />
    )
    const link = screen.getByRole('link', { name: 'Book a table' })
    expect(link).toHaveAttribute('href', '/booking')
  })

  it('does not render a link when no cta', () => {
    render(<HeroBlock _type="hero" title="Hello" />)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('does not render subtitle when not provided', () => {
    render(<HeroBlock _type="hero" title="Hello" />)
    expect(screen.queryByTestId('hero-subtitle')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test __tests__/components/blocks/HeroBlock.test.tsx
```

Expected: FAIL — `Cannot find module '@/components/blocks/HeroBlock'`.

- [ ] **Step 3: Create `components/blocks/HeroBlock.tsx`**

```typescript
import type { HeroBlock as HeroBlockType } from '@/types/cms'

export default function HeroBlock({ title, subtitle, cta }: HeroBlockType) {
  return (
    <section className="section text-center">
      <h1 className="text-4xl font-bold text-brand mb-4">{title}</h1>
      {subtitle && (
        <p data-testid="hero-subtitle" className="text-xl text-zinc-600 mb-8 max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
      {cta && (
        <a href={cta.href} className="btn-primary inline-block">
          {cta.label}
        </a>
      )}
    </section>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test __tests__/components/blocks/HeroBlock.test.tsx
```

Expected: `4 passed`.

- [ ] **Step 5: Commit**

```bash
git add components/blocks/HeroBlock.tsx __tests__/components/blocks/HeroBlock.test.tsx
git commit -m "feat: add HeroBlock component"
```

---

## Task 7: ServicesBlock Component

**Files:**
- Create: `components/blocks/ServicesBlock.tsx`
- Create: `__tests__/components/blocks/ServicesBlock.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `__tests__/components/blocks/ServicesBlock.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ServicesBlock from '@/components/blocks/ServicesBlock'

describe('ServicesBlock', () => {
  const items = [
    { title: 'Corte de pelo', description: 'Corte clásico o moderno', icon: undefined },
    { title: 'Coloración', description: 'Tintes y mechas' },
  ]

  it('renders all service cards', () => {
    render(<ServicesBlock _type="services" items={items} />)
    expect(screen.getByText('Corte de pelo')).toBeInTheDocument()
    expect(screen.getByText('Coloración')).toBeInTheDocument()
  })

  it('renders descriptions for each service', () => {
    render(<ServicesBlock _type="services" items={items} />)
    expect(screen.getByText('Corte clásico o moderno')).toBeInTheDocument()
    expect(screen.getByText('Tintes y mechas')).toBeInTheDocument()
  })

  it('renders empty state when items array is empty', () => {
    render(<ServicesBlock _type="services" items={[]} />)
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test __tests__/components/blocks/ServicesBlock.test.tsx
```

Expected: FAIL — `Cannot find module '@/components/blocks/ServicesBlock'`.

- [ ] **Step 3: Create `components/blocks/ServicesBlock.tsx`**

```typescript
import type { ServicesBlock as ServicesBlockType } from '@/types/cms'

export default function ServicesBlock({ items }: ServicesBlockType) {
  return (
    <section className="section">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {items.map((service, i) => (
          <article key={i} className="rounded-lg border border-zinc-200 p-6">
            {service.icon && <span className="text-3xl mb-3 block">{service.icon}</span>}
            <h3 className="text-xl font-semibold text-brand mb-2">{service.title}</h3>
            <p className="text-zinc-600">{service.description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test __tests__/components/blocks/ServicesBlock.test.tsx
```

Expected: `3 passed`.

- [ ] **Step 5: Commit**

```bash
git add components/blocks/ServicesBlock.tsx __tests__/components/blocks/ServicesBlock.test.tsx
git commit -m "feat: add ServicesBlock component"
```

---

## Task 8: ContactBlock Component

**Files:**
- Create: `components/blocks/ContactBlock.tsx`
- Create: `__tests__/components/blocks/ContactBlock.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `__tests__/components/blocks/ContactBlock.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ContactBlock from '@/components/blocks/ContactBlock'

describe('ContactBlock', () => {
  it('renders phone when provided', () => {
    render(<ContactBlock _type="contact" showMap={false} phone="912345678" />)
    expect(screen.getByText('912345678')).toBeInTheDocument()
  })

  it('renders email when provided', () => {
    render(<ContactBlock _type="contact" showMap={false} email="info@pepe.com" />)
    expect(screen.getByText('info@pepe.com')).toBeInTheDocument()
  })

  it('renders address when provided', () => {
    render(<ContactBlock _type="contact" showMap={false} address="Calle Mayor 1, Madrid" />)
    expect(screen.getByText('Calle Mayor 1, Madrid')).toBeInTheDocument()
  })

  it('renders map placeholder when showMap is true', () => {
    render(<ContactBlock _type="contact" showMap={true} />)
    expect(screen.getByTestId('map-placeholder')).toBeInTheDocument()
  })

  it('does not render map when showMap is false', () => {
    render(<ContactBlock _type="contact" showMap={false} />)
    expect(screen.queryByTestId('map-placeholder')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test __tests__/components/blocks/ContactBlock.test.tsx
```

Expected: FAIL — `Cannot find module '@/components/blocks/ContactBlock'`.

- [ ] **Step 3: Create `components/blocks/ContactBlock.tsx`**

```typescript
import type { ContactBlock as ContactBlockType } from '@/types/cms'

export default function ContactBlock({ showMap, phone, email, address }: ContactBlockType) {
  return (
    <section className="section">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-4">
          {phone && (
            <p className="flex items-center gap-2 text-zinc-700">
              <span className="font-semibold text-brand">Tel:</span>
              {phone}
            </p>
          )}
          {email && (
            <p className="flex items-center gap-2 text-zinc-700">
              <span className="font-semibold text-brand">Email:</span>
              {email}
            </p>
          )}
          {address && (
            <p className="flex items-center gap-2 text-zinc-700">
              <span className="font-semibold text-brand">Dirección:</span>
              {address}
            </p>
          )}
        </div>
        {showMap && (
          <div
            data-testid="map-placeholder"
            className="bg-zinc-100 rounded-lg h-64 flex items-center justify-center text-zinc-400"
          >
            Mapa (integrar Google Maps / Leaflet)
          </div>
        )}
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test __tests__/components/blocks/ContactBlock.test.tsx
```

Expected: `5 passed`.

- [ ] **Step 5: Commit**

```bash
git add components/blocks/ContactBlock.tsx __tests__/components/blocks/ContactBlock.test.tsx
git commit -m "feat: add ContactBlock component"
```

---

## Task 9: BlogListBlock Component

**Files:**
- Create: `components/blocks/BlogListBlock.tsx`
- Create: `__tests__/components/blocks/BlogListBlock.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `__tests__/components/blocks/BlogListBlock.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import BlogListBlock from '@/components/blocks/BlogListBlock'

describe('BlogListBlock', () => {
  it('renders the blog list section heading', () => {
    render(<BlogListBlock _type="blog_list" postsPerPage={6} />)
    expect(screen.getByRole('heading', { name: /blog/i })).toBeInTheDocument()
  })

  it('displays the postsPerPage configuration', () => {
    render(<BlogListBlock _type="blog_list" postsPerPage={3} />)
    expect(screen.getByTestId('posts-per-page')).toHaveTextContent('3')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test __tests__/components/blocks/BlogListBlock.test.tsx
```

Expected: FAIL — `Cannot find module '@/components/blocks/BlogListBlock'`.

- [ ] **Step 3: Create `components/blocks/BlogListBlock.tsx`**

```typescript
import type { BlogListBlock as BlogListBlockType } from '@/types/cms'

export default function BlogListBlock({ postsPerPage }: BlogListBlockType) {
  return (
    <section className="section">
      <h2 className="text-3xl font-bold text-brand mb-8">Blog</h2>
      <p className="text-zinc-500 text-sm">
        Mostrando{' '}
        <span data-testid="posts-per-page">{postsPerPage}</span>{' '}
        entradas por página.
      </p>
      {/* Post grid will be populated with real CMS data at build time */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-8" />
    </section>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test __tests__/components/blocks/BlogListBlock.test.tsx
```

Expected: `2 passed`.

- [ ] **Step 5: Commit**

```bash
git add components/blocks/BlogListBlock.tsx __tests__/components/blocks/BlogListBlock.test.tsx
git commit -m "feat: add BlogListBlock component"
```

---

## Task 10: PageRenderer

**Files:**
- Create: `components/PageRenderer.tsx`
- Create: `__tests__/components/PageRenderer.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `__tests__/components/PageRenderer.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import PageRenderer from '@/components/PageRenderer'
import type { Block } from '@/types/cms'

describe('PageRenderer', () => {
  it('renders a HeroBlock when _type is hero', () => {
    const blocks: Block[] = [{ _type: 'hero', title: 'Bienvenidos' }]
    render(<PageRenderer blocks={blocks} />)
    expect(screen.getByRole('heading', { name: 'Bienvenidos' })).toBeInTheDocument()
  })

  it('renders a ServicesBlock when _type is services', () => {
    const blocks: Block[] = [
      { _type: 'services', items: [{ title: 'Corte', description: 'Desc' }] },
    ]
    render(<PageRenderer blocks={blocks} />)
    expect(screen.getByText('Corte')).toBeInTheDocument()
  })

  it('renders a ContactBlock when _type is contact', () => {
    const blocks: Block[] = [
      { _type: 'contact', showMap: false, phone: '900000000' },
    ]
    render(<PageRenderer blocks={blocks} />)
    expect(screen.getByText('900000000')).toBeInTheDocument()
  })

  it('renders a BlogListBlock when _type is blog_list', () => {
    const blocks: Block[] = [{ _type: 'blog_list', postsPerPage: 6 }]
    render(<PageRenderer blocks={blocks} />)
    expect(screen.getByRole('heading', { name: /blog/i })).toBeInTheDocument()
  })

  it('renders multiple blocks in order', () => {
    const blocks: Block[] = [
      { _type: 'hero', title: 'Top' },
      { _type: 'contact', showMap: false, phone: '111' },
    ]
    render(<PageRenderer blocks={blocks} />)
    expect(screen.getByRole('heading', { name: 'Top' })).toBeInTheDocument()
    expect(screen.getByText('111')).toBeInTheDocument()
  })

  it('renders nothing for an empty blocks array', () => {
    const { container } = render(<PageRenderer blocks={[]} />)
    expect(container.firstChild).toBeEmptyDOMElement()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test __tests__/components/PageRenderer.test.tsx
```

Expected: FAIL — `Cannot find module '@/components/PageRenderer'`.

- [ ] **Step 3: Create `components/PageRenderer.tsx`**

```typescript
import type { Block } from '@/types/cms'
import HeroBlock from '@/components/blocks/HeroBlock'
import ServicesBlock from '@/components/blocks/ServicesBlock'
import ContactBlock from '@/components/blocks/ContactBlock'
import BlogListBlock from '@/components/blocks/BlogListBlock'

interface PageRendererProps {
  blocks: Block[]
}

export default function PageRenderer({ blocks }: PageRendererProps) {
  return (
    <>
      {blocks.map((block, i) => {
        switch (block._type) {
          case 'hero':
            return <HeroBlock key={i} {...block} />
          case 'services':
            return <ServicesBlock key={i} {...block} />
          case 'contact':
            return <ContactBlock key={i} {...block} />
          case 'blog_list':
            return <BlogListBlock key={i} {...block} />
          default:
            return null
        }
      })}
    </>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test __tests__/components/PageRenderer.test.tsx
```

Expected: `6 passed`.

- [ ] **Step 5: Commit**

```bash
git add components/PageRenderer.tsx __tests__/components/PageRenderer.test.tsx
git commit -m "feat: add PageRenderer block dispatcher"
```

---

## Task 11: Global CSS Semantic Classes + Root Layout

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`
- Create: `__tests__/app/layout.test.tsx`

- [ ] **Step 1: Write a failing test for layout theme injection**

Create `__tests__/app/layout.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest'

// Mock client-config before importing layout
vi.mock('@/lib/client-config', () => ({
  getClientConfig: vi.fn(() => ({
    clientId: 'restaurante-pepe',
    displayName: 'Restaurante Pepe',
    sanityDataset: 'restaurante-pepe-prod',
    customDomain: 'restaurante-pepe.com',
    swaResourceName: 'swa-restaurante-pepe',
    features: { blog: false, booking: true, gallery: true, menu: true },
    theme: {
      primaryColor: '#c0392b',
      accentColor: '#e74c3c',
      backgroundColor: '#fdf8f2',
      fontHeading: 'Playfair Display',
      fontBody: 'Inter',
      borderRadius: 4,
    },
  })),
}))

import { buildThemeStyles } from '@/app/layout'

describe('buildThemeStyles', () => {
  it('emits CSS variable declarations for all theme properties', () => {
    const css = buildThemeStyles({
      primaryColor: '#c0392b',
      accentColor: '#e74c3c',
      backgroundColor: '#fdf8f2',
      fontHeading: 'Playfair Display',
      fontBody: 'Inter',
      borderRadius: 4,
    })

    expect(css).toContain('--color-primary: #c0392b')
    expect(css).toContain('--color-accent: #e74c3c')
    expect(css).toContain('--color-bg: #fdf8f2')
    expect(css).toContain("--font-heading: 'Playfair Display'")
    expect(css).toContain("--font-body: 'Inter'")
    expect(css).toContain('--radius: 4px')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test __tests__/app/layout.test.tsx
```

Expected: FAIL — `buildThemeStyles` not exported from `app/layout`.

- [ ] **Step 3: Update `app/globals.css`**

Replace the full content of `app/globals.css` with:

```css
@import "tailwindcss";

/* Semantic utility classes — use CSS variables for all theme-dependent values */
.btn-primary {
  @apply px-6 py-3 font-semibold transition-opacity hover:opacity-90;
  background-color: var(--color-primary);
  color: #ffffff;
  border-radius: var(--radius);
}

.text-brand {
  color: var(--color-primary);
}

.section {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16;
}

/* Fallback values (overridden per-client in layout.tsx) */
:root {
  --color-primary: #000000;
  --color-accent: #333333;
  --color-bg: #ffffff;
  --font-heading: sans-serif;
  --font-body: sans-serif;
  --radius: 4px;
}
```

- [ ] **Step 4: Replace `app/layout.tsx`**

```typescript
import type { Metadata } from 'next'
import './globals.css'
import { getClientConfig } from '@/lib/client-config'
import type { ClientTheme } from '@/types/cms'

export const metadata: Metadata = {
  title: 'Web Builder',
}

// Exported so it can be unit-tested without rendering the full layout
export function buildThemeStyles(theme: ClientTheme): string {
  return `
    :root {
      --color-primary: ${theme.primaryColor};
      --color-accent: ${theme.accentColor};
      --color-bg: ${theme.backgroundColor};
      --font-heading: '${theme.fontHeading}', serif;
      --font-body: '${theme.fontBody}', sans-serif;
      --radius: ${theme.borderRadius}px;
    }
  `
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const clientId = process.env.CLIENT_ID!
  const config = getClientConfig(clientId)
  const themeStyles = buildThemeStyles(config.theme)

  return (
    <html lang="es">
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeStyles }} />
      </head>
      <body style={{ fontFamily: 'var(--font-body)', backgroundColor: 'var(--color-bg)' }}>
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npm test __tests__/app/layout.test.tsx
```

Expected: `1 passed`.

- [ ] **Step 6: Commit**

```bash
git add app/globals.css app/layout.tsx __tests__/app/layout.test.tsx
git commit -m "feat: inject per-client theme CSS variables in root layout"
```

---

## Task 12: Universal Catch-All Route

**Files:**
- Create: `app/[[...slug]]/page.tsx`
- Delete: `app/page.tsx`
- Create: `__tests__/app/slug-page.test.ts`

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
      { slug: '' },        // root "/"
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

    expect(params).toContainEqual({ slug: [] })           // root
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

The root `/` is now served by the optional catch-all `app/[[...slug]]/page.tsx` with `slug = []`.

- [ ] **Step 6: Run all tests to confirm nothing broke**

```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add app/[[...slug]]/page.tsx __tests__/app/slug-page.test.ts
git rm app/page.tsx
git commit -m "feat: add universal catch-all route — all pages served by [[...slug]]"
```

---

## Task 13: GitHub Actions Per-Client Deploy Workflow

**Files:**
- Create: `.github/workflows/deploy-client.yml`

No unit tests — this is infrastructure-as-code. Validate by reading the file after writing.

- [ ] **Step 1: Create `.github/workflows/deploy-client.yml`**

```yaml
name: Deploy Client

on:
  workflow_dispatch:
    inputs:
      clientId:
        description: 'Client ID to rebuild (e.g. restaurante-pepe)'
        required: true
        type: string

jobs:
  build-and-deploy:
    name: Build and Deploy ${{ github.event.inputs.clientId }}
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Set client environment variables from config
        run: |
          DATASET=$(jq -r '.sanityDataset' config/clients/${{ github.event.inputs.clientId }}.json)
          echo "SANITY_DATASET=$DATASET" >> $GITHUB_ENV

      - name: Restore Next.js build cache
        uses: actions/cache@v4
        with:
          path: .next/cache
          key: nextjs-${{ github.event.inputs.clientId }}-${{ hashFiles('package-lock.json') }}
          restore-keys: |
            nextjs-${{ github.event.inputs.clientId }}-

      - name: Build static site
        env:
          CLIENT_ID: ${{ github.event.inputs.clientId }}
          SANITY_PROJECT_ID: ${{ secrets.SANITY_PROJECT_ID }}
          SANITY_API_TOKEN: ${{ secrets[format('CMS_TOKEN_{0}', github.event.inputs.clientId)] }}
        run: npm run build

      - name: Deploy to Azure Static Web Apps
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets[format('SWA_TOKEN_{0}', github.event.inputs.clientId)] }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: upload
          app_location: /
          output_location: out
```

- [ ] **Step 2: Verify the file looks correct**

```bash
cat .github/workflows/deploy-client.yml
```

Expected: Full YAML content as written above.

- [ ] **Step 3: Commit**

```bash
mkdir -p .github/workflows
git add .github/workflows/deploy-client.yml
git commit -m "feat: add isolated per-client GitHub Actions deploy workflow"
```

---

## Task 14: Full Test Suite + TypeScript Check

- [ ] **Step 1: Run all tests**

```bash
npm test
```

Expected: All tests pass, zero failures.

- [ ] **Step 2: Run TypeScript type check**

```bash
npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 3: Verify Next.js build works for one client**

Set the two required env vars and run a build locally:

```bash
CLIENT_ID=restaurante-pepe SANITY_PROJECT_ID=your-project-id npm run build
```

Expected: Build completes. `out/` directory is created with HTML files for each page returned by `generateStaticParams`. (If no real Sanity project is set up yet, mock the fetch by temporarily hardcoding pages in `lib/cms.ts` for the smoke test, then revert.)

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "chore: verify full test suite and type check pass"
```

---

## Self-Review

### Spec coverage

| Spec requirement | Task |
|---|---|
| `output: 'export'` SSG config | Task 2 |
| `next/image` custom loader for Sanity CDN | Task 2 |
| `types/cms.ts` discriminated block union | Task 3 |
| Client config JSON per client | Task 4 |
| `lib/client-config.ts` reading by CLIENT_ID | Task 4 |
| `lib/cms.ts` Sanity abstraction | Task 5 |
| HeroBlock, ServicesBlock, ContactBlock, BlogListBlock | Tasks 6–9 |
| PageRenderer block dispatcher | Task 10 |
| CSS variable theme injection in root layout | Task 11 |
| `globals.css` semantic classes | Task 11 |
| `[[...slug]]/page.tsx` universal catch-all | Task 12 |
| GitHub Actions per-client isolated build | Task 13 |
| `CLIENT_ID` env var drives builds | Tasks 5, 11, 12, 13 |
| Webhook triggers isolated rebuild | Task 13 (`workflow_dispatch`) |
| Per-client SWA token + CMS token via secrets | Task 13 |

All spec requirements covered.

### Placeholder scan

No TBDs, no "handle edge cases", no "similar to Task N". All code blocks are complete and self-contained.

### Type consistency

- `HeroBlock`, `ServicesBlock`, `ContactBlock`, `BlogListBlock` — defined in Task 3 (`types/cms.ts`), used identically in Tasks 6–9, PageRenderer Task 10, and catch-all Task 12.
- `getClientConfig(clientId: string): ClientConfig` — defined in Task 4, called in Tasks 11 and 12.
- `createCMSClient(dataset: string)` — defined in Task 5, called in Tasks 12 and tested in Task 13.
- `buildThemeStyles(theme: ClientTheme): string` — defined and exported in Task 11, imported in Task 11's test.
