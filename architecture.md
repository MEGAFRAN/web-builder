# Architecture Overview

## Goal

A multi-tenant Next.js SSG platform where a single codebase builds isolated static sites for 100+ clients. Each client is fully described by a single JSON config file and deployed independently to Azure Static Web Apps.

---

## Core Principle: Build-Time Tenant Isolation

The `CLIENT_ID` environment variable is the single gate for every build. It selects exactly one client config JSON, which contains:
- All page content (slugs + block arrays)
- Theme tokens (CSS variables)
- Feature flags (which blocks are enabled)

No runtime switching. No external API calls. Each deployment is a completely isolated static site baked entirely from local files.

---

## Build Flow

```
GitHub Actions (manual dispatch, input: clientId)
        │
        ▼
echo CLIENT_ID={clientId} > .env.local
        │
        ▼
npm run build
  (env: CLIENT_ID)
        │
        ├── app/layout.tsx
        │     getClientConfig(CLIENT_ID) → resolveTheme() → buildThemeStyles()
        │     inject <style>:root { --color-primary: ...; --color-text: ...; ... }</style>
        │
        └── app/[[...slug]]/page.tsx
              getClientConfig(CLIENT_ID) → config.pages[]
              createJSONCMSClient(config.pages)
              generateStaticParams() → slugs[]
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

Each client lives in its own directory under `config/clients/{clientId}/`:

```
config/
  clients/
    restaurante-pepe/
      client.json          ← metadata, theme, header, footer, features
      pages/
        index.json         ← blocks for slug "" (home)
        menu.json          ← blocks for slug "menu"
        nosotros.json      ← blocks for slug "nosotros"
        contacto.json      ← blocks for slug "contacto"
  schemas/
    client.schema.json     ← JSON Schema for client.json
    blocks/
      heroBlock.schema.json
      statsBlock.schema.json
      ...one schema per block type
```

**Slug derivation**: the filename is the canonical slug. `index.json` → `""`, `menu.json` → `"menu"`. No slug field inside the file.

The loader (`lib/client-config.ts`) reads `client.json` then globs all `pages/*.json` files, assembling a `ClientConfig` object with the same TypeScript shape the rest of the app expects:

```typescript
type ClientConfig = {
  clientId: string          // "restaurante-pepe"
  displayName: string       // "Restaurante Pepe"
  customDomain: string      // "restaurante-pepe.com"
  swaResourceName: string   // Azure SWA resource name
  features: {
    blog: boolean
    booking: boolean
    gallery: boolean
    menu: boolean
  }
  theme: {
    preset?: string          // "bold-restaurant" — resolved via THEME_PRESETS
    primaryColor?: string    // overrides preset value
    accentColor?: string
    backgroundColor?: string
    textColor?: string       // primary text color on backgroundColor
    surfaceColor?: string    // card/panel background
    surfaceDark?: string     // background for dark-variant sections
    fontHeading?: string
    fontBody?: string
    borderRadius?: number
    pageInset?: string | {    // overrides preset value — raw CSS string or responsive object
      mobile: string          //   e.g. "10px" (applied below 768px)
      tablet?: string         //   e.g. "20px" (768px–1279px, optional)
      desktop: string         //   e.g. "30px" (applied at 1280px and above)
    }
    sectionSpacing?: string | { mobile: string; tablet?: string; desktop: string }
    contentGap?:     string | { mobile: string; tablet?: string; desktop: string }
  }
  pages: Array<{
    slug: string            // "" for home, "menu", "contacto", etc.
    blocks: Block[]         // typed block objects (see Block Rendering System)
  }>
}
```

**Legacy fallback**: if no directory is found, the loader falls back to reading `config/clients/{clientId}.json` (single-file format) so older clients continue to work during migration.

Adding a new client = creating a `config/clients/{clientId}/` directory with `client.json` + one JSON file per page + one GitHub secret (`SWA_TOKEN_{CLIENT_KEY}`).

Content changes = editing the relevant `pages/*.json` file (typically done by an AI agent acting on client instructions) + triggering a rebuild. Each page file is an independent unit — agents read and write only the file for the page being changed.

## JSON Schema Validation

Every block type has a corresponding JSON Schema file under `config/schemas/blocks/`. All schemas enforce:
- `_type` as a `const` — the exact block type string, no guessing
- `"additionalProperties": false` — rejects unknown fields immediately
- Nullable fields declared explicitly with `oneOf: [{type: "string"}, {type: "null"}]`

AI agents must validate their output against the relevant schema before writing. The build pipeline rejects any page file that fails schema validation.

---

## Theming System

Theming is pure CSS variables — no runtime JS.

**Preset resolution**: `lib/theme-presets.ts` exports `THEME_PRESETS` (5 named presets) and `THEME_PRESET_META` (machine-readable metadata for AI agent preset selection). `resolveTheme(clientTheme)` in `lib/client-config.ts` merges the client's optional overrides on top of the selected preset, always returning a fully-populated `ThemePreset` with 12 required fields.

1. `globals.css` defines fallback values in `:root`
2. `layout.tsx` calls `resolveTheme(config.theme)` then `buildThemeStyles(preset)` to generate:
   ```css
   :root {
     --color-primary: #c0392b;
     --color-accent: #e74c3c;
     --color-bg: #fdf8f2;
     --color-text: #2d1a0e;
     --color-surface: #ffffff;
     --color-surface-dark: #3b1c14;
     --font-heading: 'Playfair Display', serif;
     --font-body: 'Inter', sans-serif;
     --radius: 4px;
     --page-inset: clamp(1rem, 5vw, 2rem);
     --section-spacing: 5rem;
     --content-gap: 1rem;
   }
   ```
3. Injected as a `<style>` tag in `<head>` — overrides fallbacks
4. Components consume vars via Tailwind utilities and semantic classes (`.btn-primary`, `.text-brand`, `.section`)

**Horizontal padding (`--page-inset`)**: all horizontal page padding is driven by a single `--page-inset` CSS variable rather than per-component Tailwind classes. The `.section` utility and the `Container` component (default `padding="theme"`) both consume it. Each preset ships a `pageInset` value (a `clamp()` expression tuned to the preset's density and feel); clients can override it with `"pageInset"` in their `client.json` theme object. Do **not** apply horizontal padding at the layout level (e.g., wrapping `{children}`) — this would clip full-bleed section backgrounds.

**Vertical section rhythm (`--section-spacing`)**: controls the `paddingBlock` of every `Section` component. The `paddingY` prop becomes a proportional multiplier of this token (`sm` = ×0.4, `md` = ×0.6, `lg` = ×1.0, `xl` = ×1.4) rather than a hardcoded Tailwind class. Clients set it via `"sectionSpacing"` in `client.json`. Spacious presets (`bold-restaurant`, `warm-hospitality`) default to `6rem`; energetic presets (`strong-fitness`, `vibrant-retail`) default to `4rem`; all others default to `5rem`.

**Internal element spacing (`--content-gap`)**: controls the `gap` of every `Stack` component. The `gap` prop is a proportional multiplier (`sm` = ×0.5, `md` = ×1.0, `lg` = ×2, `xl` = ×3). Clients set it via `"contentGap"` in `client.json`. All presets default to `1rem`.

All three spacing tokens (`pageInset`, `sectionSpacing`, `contentGap`) accept the same two formats:
- **Raw CSS string**: `"5rem"` or any valid CSS length — injected verbatim into the variable.
- **Responsive object**: `{ "mobile": "2rem", "desktop": "6rem" }` with an optional `"tablet"` key. `resolvePageInset()` in `lib/client-config.ts` converts this to a fluid `clamp()` expression using linear interpolation between a 320px and 1280px viewport. `buildThemeStyles` and `app/layout.tsx` always receive a resolved `string` — they are unaware of the object format.

Available presets: `bold-restaurant`, `modern-minimal`, `professional-law`, `vibrant-retail`, `calm-healthcare`, `bright-education`, `modern-realestate`, `warm-hospitality`, `strong-fitness`, `creative-studio`, `community-nonprofit`, `industrial-trades`, `default`. AI agents selecting a preset should consult `THEME_PRESET_META` (keyed by preset name) which exposes `industries`, `mood`, `colorTemperature`, and `formality`.

---

## Content Layer (`lib/json-cms.ts`)

`createJSONCMSClient(pages)` is a thin wrapper over the `pages` array from the client config JSON:

```typescript
createJSONCMSClient(pages: ClientPage[]) → {
  getPages()       // returns { slug: string }[] — array map
  getPage(slug)    // returns ClientPage | null — array find
  imageUrl(source) // passthrough — image URLs are pre-resolved absolute URLs
}
```

- No network calls — all data is already in memory from the JSON file
- Promises are preserved on the interface so the page route is async-compatible
- Image URLs in the JSON must be absolute (any public CDN, Azure Blob, etc.)
- Called only during `next build` — results are baked into static HTML

---

## Block Rendering System

Pages are arrays of typed blocks. The TypeScript model is a discriminated union:

```typescript
type Block = HeroBlock | ServicesBlock | ContactBlock | BlogListBlock | ...
//           _type: 'hero' | 'services' | 'contact' | 'blog_list' | ...
```

`PageRenderer` dispatches blocks through a **component registry** (`componentRegistry.ts`):

```
config.pages[n].blocks[]
    │
    ▼
PageRenderer (registry lookup on block._type)
    │
    ▼
componentRegistry: Record<string, React.ComponentType>
    ├── 'hero'      → dynamic(() => import('./blocks/HeroBlock'))
    ├── 'services'  → dynamic(() => import('./blocks/ServicesBlock'))
    ├── 'contact'   → dynamic(() => import('./blocks/ContactBlock'))
    └── ...23 entries total
```

Each entry uses `next/dynamic` with a static import path — no computed paths. Unknown `_type` values log a warning and render nothing.

Adding a new block type = extend the `Block` union, add a component, add one entry to `componentRegistry.ts`, use it in a client's `pages` JSON.

---

## Deployment & Secrets

GitHub Actions workflow (`.github/workflows/deploy-client.yml`) is manual dispatch:

| Input | Example |
|-------|---------|
| `clientId` | `restaurante-pepe` |

Secret naming convention (hyphens → underscores):

| Secret | Purpose |
|--------|---------|
| `SWA_TOKEN_{CLIENT_KEY}` | Azure SWA deployment token |

No CMS tokens. No external API credentials. The only secret per client is the Azure deploy token.

Build cache is keyed by `{clientId}-{package-lock-hash}` so each client gets its own cache entry.

---

## Spacing Conventions

Inter-section vertical rhythm is controlled exclusively by `Section paddingY`, which scales `var(--section-spacing)` proportionally. No block component may apply `mt-*`, `mb-*`, or `my-*` on its own root element.

Horizontal inset is controlled exclusively by `Container padding="theme"` which consumes `var(--page-inset)` from the theme. No component may apply `px-*`, `mx-*`, or any inline horizontal padding on its own root element.

Internal element spacing uses `Stack gap="sm|md|lg"`, which scales `var(--content-gap)` proportionally. Raw `mb-*`/`mt-*` between siblings is forbidden.

All three spacing tokens are theme-controlled CSS variables emitted by `buildThemeStyles` and can be overridden per-client in `client.json`. They all accept a raw CSS string or a responsive `{ mobile, tablet?, desktop }` object (resolved to `clamp()` by `resolvePageInset`).

### Container maxWidth convention
- `2xl` — wide content sections (FeatureGrid, Testimonials, StatsBar)
- `xl`  — narrow content sections (Hero text, CTA, contact forms)
- `full` — full-bleed inner content
