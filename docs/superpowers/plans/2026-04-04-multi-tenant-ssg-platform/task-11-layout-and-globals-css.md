# Task 11: Root Layout + Global CSS Semantic Classes

**Plan:** Multi-Tenant SSG Platform  
**Depends on:** Task 03 (`types/cms.ts`), Task 04 (`lib/client-config.ts`)  
**Goal:** Replace the default `app/layout.tsx` with one that reads the active client's config and injects CSS custom properties for the theme into every page. Also replace `globals.css` with semantic utility classes that reference those CSS variables.

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`
- Create: `__tests__/app/layout.test.tsx`

---

- [ ] **Step 1: Write a failing test for the theme style builder**

Create `__tests__/app/layout.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest'

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

/* Semantic utility classes — all theme-dependent values use CSS variables */
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

/* Fallback values — overridden per-client by layout.tsx */
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

// Exported for unit testing without rendering the full layout tree
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
