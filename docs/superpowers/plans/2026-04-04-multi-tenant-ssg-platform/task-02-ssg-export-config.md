# Task 02: SSG Export Config + Sanity Image Loader

**Plan:** Multi-Tenant SSG Platform  
**Depends on:** Task 01 (test infrastructure installed)  
**Goal:** Enable `output: 'export'` in Next.js and wire a custom Sanity CDN image loader so `next/image` works without a server runtime.

**Files:**
- Modify: `next.config.ts`
- Create: `lib/sanity-image-loader.ts`
- Create: `__tests__/lib/sanity-image-loader.test.ts`

---

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
