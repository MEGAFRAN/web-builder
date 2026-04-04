# Task 08: ContactBlock Component

**Plan:** Multi-Tenant SSG Platform  
**Depends on:** Task 03 (`types/cms.ts` must exist)  
**Goal:** Build the Contact block — renders phone, email, address, and an optional map placeholder. All fields are optional; the block renders whatever the client has configured in Sanity.

**Files:**
- Create: `components/blocks/ContactBlock.tsx`
- Create: `__tests__/components/blocks/ContactBlock.test.tsx`

---

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
