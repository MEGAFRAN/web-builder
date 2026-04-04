# Architecture Overview

## Goal

A multi-tenant Next.js SSG platform where a single codebase builds isolated static sites for 100+ clients. Each client is driven by a dedicated Sanity CMS dataset and deployed independently to Azure Static Web Apps.

---

## Core Principle: Build-Time Tenant Isolation

The `CLIENT_ID` environment variable is the single gate for every build. It selects exactly one client config JSON, which injects:
- Sanity project ID and dataset (CMS data source)
- Theme tokens (CSS variables)
- Feature flags (which blocks are enabled)

No runtime switching. Each deployment is a completely isolated static site.

---

## Directory Structure

```
web-builder/
├── app/
│   ├── layout.tsx               # Root layout — reads CLIENT_ID, injects theme
│   ├── [[...slug]]/
│   │   └── page.tsx             # Catch-all route — fetches pages from Sanity at build time
│   └── globals.css              # CSS variable fallbacks, semantic utility classes
├── components/
│   ├── PageRenderer.tsx         # Block dispatcher — switch on _type
│   └── blocks/
│       ├── HeroBlock.tsx
│       ├── ServicesBlock.tsx
│       ├── ContactBlock.tsx
│       └── BlogListBlock.tsx
├── lib/
│   ├── client-config.ts         # Loads /config/clients/{clientId}.json at build time
│   ├── cms.ts                   # Sanity client factory — getPages(), getPage(), imageUrl()
│   └── sanity-image-loader.ts   # Next.js custom image loader backed by Sanity
├── types/
│   └── cms.ts                   # ClientConfig, ClientTheme, Block discriminated union
├── config/
│   └── clients/
│       ├── restaurante-pepe.json
│       └── peluqueria-ana.json
├── __tests__/                   # Vitest suite mirroring source structure
└── .github/workflows/
    └── deploy-client.yml        # Manual workflow — one run per client
```

---

## Build Flow

```
GitHub Actions (manual dispatch, input: clientId)
        │
        ▼
Read config/clients/{clientId}.json (jq)
        │
        ├── sanityProjectId, sanityDataset ──► set as env vars
        └── swaResourceName ──────────────► used for Azure deploy target
        │
        ▼
npm run build
  (env: CLIENT_ID, SANITY_PROJECT_ID, SANITY_DATASET, SANITY_API_TOKEN)
        │
        ├── app/layout.tsx
        │     getClientConfig(CLIENT_ID) → load theme → buildThemeStyles()
        │     inject <style>:root { --color-primary: ...; ... }</style>
        │
        └── app/[[...slug]]/page.tsx
              generateStaticParams() → createCMSClient() → getPages() → slugs[]
              Page() → getPage(slug) → <PageRenderer blocks={blocks} />
        │
        ▼
/out  (static HTML + CSS + JS)
        │
        ▼
Azure Static Web Apps (deploy token: SWA_TOKEN_{CLIENT_KEY})
```

---

## Multi-Tenancy: Client Config Schema

Each file at `config/clients/{clientId}.json` fully describes a tenant:

```typescript
type ClientConfig = {
  clientId: string          // "restaurante-pepe"
  displayName: string       // "Restaurante Pepe"
  sanityProjectId: string   // Sanity project ID
  sanityDataset: string     // Sanity dataset name
  customDomain: string      // "restaurante-pepe.com"
  swaResourceName: string   // Azure SWA resource name
  features: {
    blog: boolean
    booking: boolean
    gallery: boolean
    menu: boolean
  }
  theme: {
    primaryColor: string    // "#c0392b"
    accentColor: string     // "#e74c3c"
    backgroundColor: string // "#fdf8f2"
    fontHeading: string     // "Playfair Display"
    fontBody: string        // "Inter"
    borderRadius: number    // 4
  }
}
```

Adding a new client = adding one JSON file + two GitHub secrets (`CMS_TOKEN_{CLIENT_KEY}`, `SWA_TOKEN_{CLIENT_KEY}`).

---

## Theming System

Theming is pure CSS variables — no runtime JS, no styled-components.

1. `globals.css` defines fallback values in `:root`
2. `layout.tsx` reads the client theme at build time and generates:
   ```css
   :root {
     --color-primary: #c0392b;
     --color-accent: #e74c3c;
     --color-bg: #fdf8f2;
     --font-heading: 'Playfair Display', serif;
     --font-body: 'Inter', sans-serif;
     --radius: 4px;
   }
   ```
3. Injected as a `<style>` tag in `<head>` — overrides fallbacks
4. Components consume vars via Tailwind utilities and semantic classes (`.btn-primary`, `.text-brand`, `.section`)

Each client's static site is baked with different CSS variable values — no per-request computation.

---

## CMS Layer (Sanity)

`lib/cms.ts` is a thin factory abstraction over `@sanity/client`:

```typescript
createCMSClient(projectId, dataset) → {
  getPages()       // *[_type == "page"]{ slug }
  getPage(slug)    // *[_type == "page" && slug.current == $slug][0]{ slug, blocks[]{ _type, ... } }
  imageUrl(source) // imageUrlBuilder chain
}
```

- API version pinned to `'2024-01-01'`
- CDN enabled for read queries
- Called only during `next build` — results are baked into static HTML
- `sanity-image-loader.ts` implements the Next.js `ImageLoader` interface on top of the same Sanity client, enabling `<Image>` to serve optimized CDN URLs

---

## Block Rendering System

Pages in Sanity are arrays of typed blocks. The TypeScript model is a discriminated union:

```typescript
type Block = HeroBlock | ServicesBlock | ContactBlock | BlogListBlock
//           _type: 'hero' | 'services' | 'contact' | 'blog_list'
```

`PageRenderer` maps block type to component via an exhaustive switch:

```
Sanity page.blocks[]
    │
    ▼
PageRenderer (switch on block._type)
    ├── 'hero'      → <HeroBlock title subtitle cta />
    ├── 'services'  → <ServicesBlock items[] />
    ├── 'contact'   → <ContactBlock showMap phone email address />
    └── 'blog_list' → <BlogListBlock postsPerPage />
```

Adding a new block type = add a Sanity schema field, extend the `Block` union, add a component, add a case in the switch.

---

## Deployment & Secrets

GitHub Actions workflow (`.github/workflows/deploy-client.yml`) is manual dispatch:

| Input | Example |
|-------|---------|
| `clientId` | `restaurante-pepe` |

Secret naming convention (hyphens → underscores):

| Secret | Purpose |
|--------|---------|
| `CMS_TOKEN_{CLIENT_KEY}` | Sanity read API token |
| `SWA_TOKEN_{CLIENT_KEY}` | Azure SWA deployment token |

The workflow reads `sanityProjectId` and `sanityDataset` directly from the config JSON using `jq` — no hardcoding in the workflow file itself.

Build cache is keyed by `{clientId}-{package-lock-hash}` so each client gets its own cache entry.

---

## Testing

Vitest suite in `__tests__/` mirrors the source tree:

| Layer | Strategy |
|-------|---------|
| Components | `@testing-library/react` — render + assert DOM |
| Lib functions | `vi.mock()` for Sanity client and `fs`, test pure logic |
| Types | `expectTypeOf()` — validate discriminated union narrowing |
| Integration | Slug page generation with mocked CMS responses |

Environment: `jsdom` for React tests, `node` for build-time modules.

---

## Technology Choices

| Concern | Choice | Why |
|---------|--------|-----|
| Framework | Next.js 16 (App Router, SSG `output: 'export'`) | Static output, file-system routing, Image optimization |
| CMS | Sanity | Per-project datasets → natural tenant isolation |
| Styling | TailwindCSS 4 + CSS variables | Utility-first + zero-JS theming |
| Hosting | Azure Static Web Apps | Per-client SWA resource, free tier scales |
| CI/CD | GitHub Actions (manual dispatch) | On-demand per-client builds, secrets per client |
| Testing | Vitest + Testing Library | Fast, ESM-native, Vite-aligned |
