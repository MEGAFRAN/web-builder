# Task 07: ServicesBlock Component

**Plan:** Multi-Tenant SSG Platform  
**Depends on:** Task 03 (`types/cms.ts` must exist)  
**Goal:** Build the Services grid block — renders an array of service cards (title + description + optional icon). Used by clients like hair salons, restaurants, and tradespeople to showcase their offerings.

**Files:**
- Create: `components/blocks/ServicesBlock.tsx`
- Create: `__tests__/components/blocks/ServicesBlock.test.tsx`

---

- [ ] **Step 1: Write the failing test**

Create `__tests__/components/blocks/ServicesBlock.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ServicesBlock from '@/components/blocks/ServicesBlock'

describe('ServicesBlock', () => {
  const items = [
    { title: 'Corte de pelo', description: 'Corte clásico o moderno' },
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
