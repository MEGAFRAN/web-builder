# Task 04: Client Config System

**Plan:** Multi-Tenant SSG Platform  
**Depends on:** Task 03 (`types/cms.ts` must exist)  
**Goal:** Create the per-client JSON config files and the loader function that reads them by `CLIENT_ID`. This is what makes the platform multi-tenant — every build reads exactly one client's config.

**Files:**
- Create: `lib/client-config.ts`
- Create: `config/clients/restaurante-pepe.json`
- Create: `config/clients/peluqueria-ana.json`
- Create: `__tests__/lib/client-config.test.ts`

---

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
