# Task 09: BlogListBlock Component

**Plan:** Multi-Tenant SSG Platform  
**Depends on:** Task 03 (`types/cms.ts` must exist)  
**Goal:** Build the Blog list block — a structural placeholder that reserves space for a paginated post grid. Only clients with `features.blog: true` will have this block in their Sanity pages. The post grid is populated at build time from Sanity data (future work); for now it renders the heading and pagination config.

**Files:**
- Create: `components/blocks/BlogListBlock.tsx`
- Create: `__tests__/components/blocks/BlogListBlock.test.tsx`

---

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
      {/* Post grid populated with real CMS data at build time */}
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
