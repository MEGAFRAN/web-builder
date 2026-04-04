# Task 06: HeroBlock Component

**Plan:** Multi-Tenant SSG Platform  
**Depends on:** Task 03 (`types/cms.ts` must exist), Task 11 (`globals.css` semantic classes will provide `.btn-primary`, `.text-brand`, `.section` — but the component can be written before Task 11 since CSS classes don't affect rendering tests)  
**Goal:** Build the Hero section block — the most common first block on any client page. Renders a heading, optional subtitle, and optional CTA link.

**Files:**
- Create: `components/blocks/HeroBlock.tsx`
- Create: `__tests__/components/blocks/HeroBlock.test.tsx`

---

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
