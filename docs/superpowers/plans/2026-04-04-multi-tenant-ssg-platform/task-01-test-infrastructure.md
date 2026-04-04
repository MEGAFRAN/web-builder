# Task 01: Test Infrastructure

**Plan:** Multi-Tenant SSG Platform  
**Goal:** Install all dependencies (Sanity packages + test tooling) and configure Vitest with React Testing Library so every subsequent task can be tested.

**Files:**
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Modify: `package.json` (add test script + devDependencies)
- Create: `__tests__/smoke.test.tsx`

---

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
