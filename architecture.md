# Architecture Overview

## Goal

A multi-tenant Next.js SSG platform where a single codebase builds isolated static sites for 100+ clients. Each client is fully described by a single JSON config file and deployed independently to Azure Blob Storage (primary) or Azure Static Web Apps.

---

## Core Principle: Build-Time Tenant Isolation

The `CLIENT_ID` environment variable is the single gate for every public client build. It selects exactly one client config JSON, which contains:
- All page content (slugs + block arrays)
- Theme tokens (CSS variables)
- Feature flags (which blocks are enabled)

No runtime tenant switching for **public client sites**: each blob build targets exactly one `CLIENT_ID`. Page content, theme, and navigation are baked from JSON at build time. Interactive features (**booking widget**, **contact forms**) call external Azure Functions via URLs configured in `client.json`.

The **admin portal** is a separate deployment — a single shared client-side SPA that serves all tenants. It identifies the active tenant from the authenticated user's JWT, not from `CLIENT_ID` at build time. See [Runtime APIs, booking & admin](#runtime-apis-booking--admin) and [`architecture-booking-system.md`](architecture-booking-system.md).

---

## Build Targets

Three distinct build modes are supported, each producing a different static artifact:

| Command | Script | Output | Includes | Excludes |
|---|---|---|---|---|
| `npm run build:blob` | `scripts/prepare-static-export.mjs` | `/out` (trailing slash) | Public site routes only | `app/api/`, `app/admin/` |
| `npm run build:admin` | `scripts/prepare-admin-export.mjs` | `/out` | Admin SPA routes only | `app/api/`, `app/(site)/` |
| `npm run dev` | `scripts/run-next-dev.mjs` | Dev server | All routes | Nothing |

The prepare scripts temporarily move excluded directories outside `app/` before calling `next build`, then restore them on exit regardless of build success or failure. `next.config.ts` enables `output: 'export'` for all non-dev builds; `trailingSlash` is enabled only for `DEPLOY_TARGET=blob`.

---

## Build Flow

### Public client site (blob deploy)

```
GitHub Actions — deploy-websites.yml (manual dispatch, input: clientId)
        │
        ▼
echo CLIENT_ID={clientId} > .env.local
        │
        ▼
npm run build:blob
  scripts/prepare-static-export.mjs
    ├── move app/api/   → .blob-excluded/api/
    ├── move app/admin/ → .blob-excluded/admin/
    ├── next build  (DEPLOY_TARGET=blob, output: export, trailingSlash: true)
    │     app/layout.tsx
    │       getClientConfig(CLIENT_ID) → resolveTheme() → buildThemeStyles()
    │       inject <style>:root { --color-primary: ...; ... }</style>
    │     app/[[...slug]]/page.tsx
    │       getClientConfig(CLIENT_ID) → config.pages[]
    │       generateStaticParams() → slugs[]
    │       Page() → getPage(slug) → <PageRenderer blocks={blocks} />
    └── restore app/api/ and app/admin/
        │
        ▼
/out  (static HTML + CSS + JS, no admin or API artifacts)
        │
        ▼
Azure Blob Storage — $web container (synced via az storage blob sync)
```

### Admin SPA (single shared deployment)

```
GitHub Actions — deploy-admin.yml (triggers on push to main / manual)
        │
        ▼
npm run build:admin
  scripts/prepare-admin-export.mjs
    ├── require NEXT_PUBLIC_ADMIN_API_URL
    ├── move app/api/    → .admin-excluded/api/
    ├── move app/(site)/ → .admin-excluded/site/
    ├── next build  (DEPLOY_TARGET=admin, output: export)
    │     app/admin/* — all "use client", no server data fetching
    │     NEXT_PUBLIC_ADMIN_API_URL baked into bundle
    └── restore app/api/ and app/(site)/
        │
        ▼
/out  (admin SPA — one deployment, serves all clients)
        │
        ▼
Azure Static Web Apps — $web-admin (single instance)
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

Adding a new client = creating a `config/clients/{clientId}/` directory with `client.json` + one GitHub secret (`SWA_TOKEN_{CLIENT_KEY}` for SWA deploys) or an Azure Blob Storage container for blob deploys. If the client declares a `template`, all pages, header, and footer are inherited automatically — no `pages/` directory required.

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

`next.config.ts` enables `output: 'export'` for all non-dev builds. The resulting static artifact contains no server-side Route Handlers. **Route Handlers** in `app/api/` run only when the app executes as a Next.js server (`npm run dev`) and are excluded from all static export builds via the prepare scripts.

For deployed environments, dynamic behavior is handled by Azure Functions configured via `client.json`:

| Mechanism | Purpose |
|-----------|---------|
| `client.json` → `reservationEndpoint` | POST target for reservation submissions. If unset, the booking widget calls the local Route Handler (dev only). |
| `client.json` → `bookingServicesEndpoint` | Optional full URL override for the services catalog. If unset, deploy uses `ADMIN_API_URL` + `/booking-services`. |
| `reservationBlock` → `availabilityEndpoint` | GET target for booked-slot queries. If unset, calls local `/api/availability` (dev only). |
| `NEXT_PUBLIC_BOOKING_API_URL` | Azure Functions base URL for the public services catalog, baked into client site bundles at blob build time. |
| `reservationBlock` → `clientId` | Scopes availability and reservation records to this tenant. |
| `NEXT_PUBLIC_ADMIN_API_URL` | Azure Functions base URL for the admin SPA. If unset, admin SPA calls local Route Handlers (dev only). |

Reference implementation for hosted reservations and Cosmos DB: [`azure-functions/README.md`](azure-functions/README.md).

### Public-facing APIs (unauthenticated, dev only)

Used by site blocks and forms during local development. In production, the equivalent Azure Functions are called directly from the browser.

| Route | Role |
|-------|------|
| `GET /api/booking-services` | Read-only service catalog for the booking widget. |
| `POST /api/reservation` | Accepts widget submissions; forwards to `reservationEndpoint` when configured, otherwise local JSON append. |
| `GET /api/availability` | Returns booked time slots for a date + duration. |
| `POST /api/contact` | Contact form; forwards to `client.json` → `contactEndpoint` when set, otherwise logs server-side. |

### Admin portal

Routes under `/admin` are a **client-side SPA** — all pages are `"use client"` with no server rendering. The admin surface is excluded from public blob builds and deployed independently via `deploy-admin.yml` to a shared Azure Static Web Apps instance.

- One admin SPA deployment serves all clients.
- The active tenant is identified from the JWT issued at login (`{ email, clientId, exp }`), not from `CLIENT_ID`.
- `lib/admin-api.ts` routes all admin fetches to local Route Handlers (dev) or Azure Functions (deployed) based on `NEXT_PUBLIC_ADMIN_API_URL`.
- Session state is managed by `AdminAuthContext` (`lib/admin-auth-context.tsx`) using `sessionStorage`.

Full admin architecture: [`architecture-booking-system.md`](architecture-booking-system.md).

### Local persistence (`data/`)

For development without upstream Functions. JSON files hold operational state:

| File | Managed by |
|------|------------|
| `booking-services-local.json` | Admin services UI + `/api/booking-services` |
| `reservations-local.json` | `/api/reservation` when no `reservationEndpoint` |
| `booking-schedule-local.json` | Admin availability / schedule APIs |

These files are **per deployment / per clone**, not shared across clients in Git — treat them like environment-specific data. They will be retired once Azure Functions and Cosmos DB are the authoritative data store.

---

## Deployment & Secrets

### Client sites — `deploy-websites.yml` (blob)

Manual dispatch workflow; one run per client:

| Input | Example |
|-------|---------|
| `clientId` | `restaurante-pepe` |

The workflow runs `npm run build:blob`, which excludes server-only routes via `scripts/prepare-static-export.mjs`, then syncs `/out` to the client's Azure Blob Storage `$web` container using `az storage blob sync`.

Azure resources are discovered by tag (`client_id` or `team_id` on the storage account) — no per-client secret needed beyond Azure OIDC credentials.

### Client sites — `deploy-azure-static.yml` (SWA, legacy)

Alternative deploy target using Azure Static Web Apps. Runs `npm run build:blob`. Requires a per-client deploy token:

| Secret | Naming convention |
|--------|---------|
| `SWA_TOKEN_{CLIENT_KEY}` | Hyphens in `clientId` replaced with underscores |

### Admin SPA — `deploy-admin.yml`

Triggered on push to `main` when admin-related files change, or via manual dispatch. Runs `npm run build:admin`.

| Secret / Variable | Purpose |
|--------|---------|
| `SWA_TOKEN_ADMIN` | Azure SWA deployment token for the shared admin instance |
| `ADMIN_API_URL` (variable) | Azure Functions base URL, baked into the admin bundle as `NEXT_PUBLIC_ADMIN_API_URL` |
| `ADMIN_BUILD_CLIENT_ID` (variable) | Any valid `clientId` used only to resolve root layout CSS tokens at build time |

### Local dev secrets

| Variable | Required for |
|----------|-------------|
| `CLIENT_ID` | Every build and `npm run dev` |
| `ADMIN_JWT_SECRET` | Local admin login and session validation |
| `ADMIN_EMAIL` | Local admin login |
| `ADMIN_PASSWORD` | Local admin login |

Optional for local Azure Functions testing: `COSMOS_DB_ENDPOINT`, `COSMOS_DB_KEY`, `ADMIN_JWT_SECRET` — see [`azure-functions/README.md`](azure-functions/README.md).

Build cache is keyed by `{clientId}-{package-lock-hash}` so each client gets its own cache entry.
