# Architecture Overview

## Goal

A multi-tenant Next.js SSG platform where a single codebase builds isolated static sites for 100+ clients. Each client is fully described by a single JSON config file and deployed independently to Azure Static Web Apps.

---

## Core Principle: Build-Time Tenant Isolation

The `CLIENT_ID` environment variable is the single gate for every build. It selects exactly one client config JSON, which contains:
- All page content (slugs + block arrays)
- Theme tokens (CSS variables)
- Feature flags (which blocks are enabled)

No runtime tenant switching: each deployment targets exactly one `CLIENT_ID`. Page content, theme, and navigation are baked from JSON at build time. Interactive features (**booking widget**, **contact forms**, **admin portal**) use Route Handlers under `app/api/` and browser `fetch`, always scoped to that deployment’s client — see [Runtime APIs, booking & admin](#runtime-apis-booking--admin).

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
      client.json          ← metadata, theme, header, footer, features, template ref
      pages/               ← optional; files here override the template's pages by slug
    test-restaurant/
      client.json          ← declares template only — no pages/ dir needed
  templates/
    restaurant-standard/
      template.json        ← template metadata + default header + default footer
      pages/
        index.json
        menu.json
        nosotros.json
        contacto.json
    portfolio-minimal/
      template.json
      pages/
        index.json
        success-cases.json
        contact.json
    landing-page/
      template.json
      pages/
        index.json
  schemas/
    client.schema.json     ← JSON Schema for client.json
    blocks/
      heroBlock.schema.json
      statsBlock.schema.json
      ...one schema per block type
```

**Slug derivation**: the filename is the canonical slug. `index.json` → `""`, `menu.json` → `"menu"`. No slug field inside the file. Subdirectories map to nested slugs: `success-cases/acme.json` → `"success-cases/acme"`.

The loader (`lib/client-config.ts`) reads `client.json`, resolves the template layer (if any), then assembles a `ClientConfig` object with the same TypeScript shape the rest of the app expects:

```typescript
type ClientConfig = {
  clientId: string          // "restaurante-pepe"
  displayName: string       // "Restaurante Pepe"
  customDomain: string      // "restaurante-pepe.com"
  swaResourceName: string   // Azure SWA resource name
  template?: string | null  // "restaurant-standard" — optional template name
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
  reservationEndpoint?: string  // optional POST target for /api/reservation (e.g. Azure Function)
  contactEndpoint?: string      // optional POST target for /api/contact
}
```

Adding a new client = creating a `config/clients/{clientId}/` directory with `client.json` + one GitHub secret (`SWA_TOKEN_{CLIENT_KEY}`). If the client declares a `template`, all pages, header, and footer are inherited automatically — no `pages/` directory required.

Content changes = editing the relevant `pages/*.json` file (typically done by an AI agent acting on client instructions) + triggering a rebuild. Each page file is an independent unit — agents read and write only the file for the page being changed.

---

## Template System

Templates provide reusable defaults for pages, header, and footer. A client declaring `"template": "restaurant-standard"` gets a fully navigable site from a minimal `client.json` with no `pages/` directory.

### Resolution order (all layers are shallow — client always wins)

```
template pages       ← base layer (all slugs from templates/{name}/pages/)
      +
client pages         ← override layer (files in config/clients/{id}/pages/)
      ↓
merged pages         (client slug wins on collision; template-only slugs kept as-is)

template.json header ← fallback if client.json has no header
template.json footer ← fallback if client.json has no footer
client.json header   ← takes precedence entirely if present
client.json footer   ← takes precedence entirely if present
```

### `template.json` shape

```json
{
  "templateId": "restaurant-standard",
  "displayName": "Restaurant Standard",
  "description": "...",
  "defaultThemePreset": "bold-restaurant",
  "defaultFeatures": { "blog": false, "booking": true, "gallery": true, "menu": true },
  "header": { "logo": "...", "ctaLabel": "...", "ctaAction": "...", "links": [...] },
  "footer": { "copyright": "...", "columns": [...] }
}
```

`defaultThemePreset` and `defaultFeatures` are informational — they are not applied automatically; clients must still declare their own `theme` and `features`. Only `pages/`, `header`, and `footer` are merged at build time.

### Key functions in `lib/client-config.ts`

| Function | Export | Purpose |
|---|---|---|
| `loadTemplateMeta(name)` | internal | Reads and parses `template.json`; returns `null` if missing |
| `loadTemplatePages(name)` | internal | Loads all page JSON files from `templates/{name}/pages/` |
| `mergeTemplatePages(templatePages, clientPages)` | **exported** | Pure merge; client slug wins on collision |

Everything downstream of `getClientConfig()` — `app/layout.tsx`, `PageRenderer`, CI, block components — is unaffected by the template layer.

## Theming & Spacing

Theming is pure CSS variables injected at build time via `resolveTheme()` → `buildThemeStyles()`. Components consume them through Tailwind utilities and semantic classes — no runtime JS.

**→ Full details, preset list, spacing token rules, and component conventions: [`docs/theme.md`](docs/theme.md)**

---

## Block System

Pages are arrays of typed blocks dispatched through a component registry (`componentRegistry.ts`). Each block type has a JSON Schema under `config/schemas/blocks/` — agents must validate before writing.

**→ Block rendering pipeline, adding new block types, schema rules, page file format, content layer: [`docs/blocks.md`](docs/blocks.md)**

---

## Runtime APIs, booking & admin

Production builds use `output: 'export'` in `next.config.ts` (static HTML/CSS/JS under `/out`). That artifact is ideal for Azure Static Web Apps. **Route Handlers** in `app/api/` run when the app is executed as a Next.js server (for example local `npm run dev` or a Node-hosted preview). For fully static hosting, point dynamic behavior at backends via config:

| Mechanism | Purpose |
|-----------|---------|
| `client.json` → `reservationEndpoint` | Optional URL for `POST` reservation payloads (e.g. Azure Function). If unset, submissions append to `data/reservations-local.json` via `/api/reservation`. |
| `reservationBlock` → `availabilityEndpoint` | Optional URL for booked-slot queries. If unset, the widget calls `/api/availability`. |
| `reservationBlock` → `clientId` | Scopes availability and reservation records to this tenant (must align with `CLIENT_ID` for built-in APIs). |

Reference implementation for hosted reservations + Cosmos: [`azure-functions/README.md`](azure-functions/README.md).

### Public-facing APIs (unauthenticated)

Used by site blocks and forms; all assume `CLIENT_ID` is set server-side for this deployment.

| Route | Role |
|-------|------|
| `GET /api/booking-services` | Read-only service catalog for the booking widget. Same persistence as admin services (`data/booking-services-local.json`). Optional query `?clientId=` must match `CLIENT_ID` when both are set. |
| `POST /api/reservation` | Accepts widget submissions; forwards to `reservationEndpoint` when configured, otherwise local JSON append. |
| `GET /api/availability` | Returns booked time slots for a date + duration (local/dev companion to the widget). |
| `POST /api/contact` | Contact form; forwards to `client.json` → `contactEndpoint` when set, otherwise logs server-side and returns `{ ok: true }`. |

### `reservationBlock` & admin-managed services

- **Admin** (`/admin/services`) reads/writes the catalog via `GET`/`PUT /api/admin/services` (session-protected).
- **`ReservationBlock`** loads `GET /api/booking-services` on mount. If the admin catalog has one or more services, **those are shown**. Optional `services` on the page JSON are **CMS fallback** only when the live catalog is empty.
- While the catalog request is in flight and there is no CMS fallback, the block shows a short loading state instead of stale placeholders.

### Admin portal

Routes under `/admin` (bookings, services, availability schedule, settings). Dashboard APIs live under `/api/admin/*` and require a signed session cookie derived from `ADMIN_SESSION_SECRET`; the session payload is bound to `CLIENT_ID` so operators cannot cross tenants.

### Local persistence (`data/`)

For development and installs without upstream Functions, JSON files hold operational state (examples):

| File | Managed by |
|------|------------|
| `booking-services-local.json` | Admin services UI + `/api/booking-services` |
| `reservations-local.json` | `/api/reservation` when no `reservationEndpoint` |
| `booking-schedule-local.json` | Admin availability / schedule APIs |

These files are **per deployment / per clone**, not shared across clients in Git — treat them like environment-specific data.

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
| `ADMIN_SESSION_SECRET` | HMAC secret for admin login sessions (required for `/admin` and `/api/admin/*` outside auth routes). |

Optional when using Azure Functions for reservations (see `azure-functions/`): Cosmos and SendGrid variables are configured on the Function App, not in the static site repo.

No CMS tokens for page content. The only secret **per client** in the static deploy workflow is typically the Azure deploy token; admin bookings need `ADMIN_SESSION_SECRET` wherever Route Handlers run.

Build cache is keyed by `{clientId}-{package-lock-hash}` so each client gets its own cache entry.

