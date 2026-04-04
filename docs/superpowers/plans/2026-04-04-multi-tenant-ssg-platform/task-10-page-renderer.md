# Task 10: PageRenderer

**Plan:** Multi-Tenant SSG Platform  
**Depends on:** Tasks 06–09 (all four block components must exist), Task 03 (`types/cms.ts`)  
**Goal:** Build the central block dispatcher — a component that receives a `Block[]` array from the CMS and renders the correct component for each `_type`. The switch statement is exhaustive by TypeScript's type narrowing.

**Files:**
- Create: `components/PageRenderer.tsx`
- Create: `__tests__/components/PageRenderer.test.tsx`

---

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
