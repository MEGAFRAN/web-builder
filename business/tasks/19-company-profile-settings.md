# Task: Company Profile Settings

**Status:** Ready for development  
**Priority:** High — foundational data that drives navbar, footer, SEO metadata, and contact blocks across all client sites  
**Owner:** Next.js Frontend Developer + Backend  
**Estimated scope:** Medium — new data model, dual-path persistence, admin UI form, and public site read integration  
**Depends on:** None (self-contained; Cosmos path builds on `03-setup-cosmos-db-admin-containers`)

---

## Context

Today, company information (business name, phone, email, address, hours) is **scattered** across `client.json` in multiple disconnected fields: `displayName`, `siteMetadata.defaultDescription`, `header.logo`, `footer.columns`, `bottomActionBar.items`, and page-level blocks (`contactInfoBlock`, `location`). There is no single source of truth.

The admin `/settings` page is a placeholder with no form and no write API. Merchants have no way to update their own business information through the admin panel.

This task creates a canonical `CompanyProfile` data model, a dual-path persistence layer (local JSON for dev, Cosmos DB for production), a write API with full auth, an admin settings form, and an abstraction layer so the public site reads company data from one authoritative source that feeds into layout, blocks, and metadata.

---

## Data model

### `CompanyProfile` type

```typescript
// types/admin.ts — append this type
export type CompanyProfile = {
  businessName: string           // e.g. "Hair Salon Emma" — displayed in navbar logo, footer, OG title
  phone: string                  // e.g. "+44 207 946 0958" — used in tel: links, contact blocks, JSON-LD
  email: string                  // e.g. "hello@emmasalon.com" — used in mailto: links and contact blocks
  address: {
    street: string               // e.g. "123 High Street"
    city: string                 // e.g. "London"
    postalCode: string           // e.g. "W1A 1AA"
    country: string              // e.g. "United Kingdom"
  }
  hours: string                  // Free-text, e.g. "Mon–Sat 9:00–18:00, Sun closed"
  logoUrl: string | null         // Image URL or null (falls back to businessName as text)
  whatsapp: string | null        // e.g. "+447911123456" for wa.me links (optional)
}
```

All fields except `address.*` sub-fields, `logoUrl`, and `whatsapp` are required (non-nullable). The admin form must enforce this.

### Local JSON schema (dev)

```json
// data/company-profile-local.json
{
  "clientId": "hair-salon",
  "businessName": "Hair Salon",
  "phone": "+44 207 946 0958",
  "email": "hello@salon.com",
  "address": {
    "street": "123 High Street",
    "city": "London",
    "postalCode": "W1A 1AA",
    "country": "United Kingdom"
  },
  "hours": "Lun–Sáb 9:00–18:00",
  "logoUrl": null,
  "whatsapp": null
}
```

> **Note:** In local dev, this file is scoped to the single client running (`process.env.CLIENT_ID`). Multi-tenant isolation is handled by `clientId` partition key in Cosmos.

---

## Persistence layer

### Local dev — `lib/company-profile-db.ts`

Follow the exact same pattern as `lib/booking-services-db.ts`:

- `readCompanyProfile(): Promise<CompanyProfile | null>` — reads `data/company-profile-local.json`; returns `null` if file does not exist (no data seeded yet)
- `writeCompanyProfile(profile: CompanyProfile): Promise<void>` — writes atomically to `data/company-profile-local.json`
- File path must use `process.cwd()` to resolve correctly regardless of CWD

```typescript
// lib/company-profile-db.ts (structure — not implementation)
const LOCAL_FILE = path.join(process.cwd(), 'data', 'company-profile-local.json')

export async function readCompanyProfile(): Promise<CompanyProfile | null>
export async function writeCompanyProfile(profile: CompanyProfile): Promise<void>
```

### Production — Cosmos DB container

When `NEXT_PUBLIC_ADMIN_API_URL` is set (all deployed environments), the Azure Functions handle persistence. A new Cosmos container is required:

| Container | Partition key | Purpose |
|-----------|---------------|---------|
| `client-profile` | `/clientId` | One document per client; holds `CompanyProfile` fields + `clientId` |

Document shape in Cosmos:

```json
{
  "id": "<clientId>-profile",
  "clientId": "<clientId>",
  "businessName": "...",
  "phone": "...",
  "email": "...",
  "address": { "street": "...", "city": "...", "postalCode": "...", "country": "..." },
  "hours": "...",
  "logoUrl": null,
  "whatsapp": null
}
```

Add the `client-profile` container to `business/tasks/03-setup-cosmos-db-admin-containers.md` as an amendment.

---

## Admin API

### Local Next.js route — `app/api/admin/company-profile/route.ts`

Follow the same auth + response pattern as `app/api/admin/services/route.ts`.

**`GET /api/admin/company-profile`**

- Validate `admin-session` JWT with `requireAdminSession(req)`
- Return `{ profile: CompanyProfile | null }` — `null` when no data exists yet (first-time setup)
- Never return 404; an empty profile is a valid state

**`PUT /api/admin/company-profile`**

- Validate JWT
- Parse body; validate shape with an `isCompanyProfile(x)` type guard (same pattern as `isServiceRow`)
- Required fields: `businessName` (non-empty string), `phone` (non-empty string), `email` (valid email format — basic regex is sufficient), `address.street`, `address.city`, `address.postalCode`, `address.country` (all non-empty strings)
- Optional fields: `hours`, `logoUrl`, `whatsapp` — validate as `string | null`
- On validation failure: return `422 { error: string }`
- On success: `writeCompanyProfile(profile)` → return `200 { ok: true }`
- `clientId` must always come from the validated JWT, never from the request body

### Azure Functions (production path)

Add two new Functions to `azure-functions/src/functions/admin/`:

- `GET /admin/company-profile` — reads from `client-profile` Cosmos container
- `PUT /admin/company-profile` — validates + upserts to `client-profile` Cosmos container

These mirror the local route handlers 1:1. Auth follows the same `validateAdminJwt(req)` helper from task 04. Add to the endpoint list in `business/tasks/04-implement-admin-azure-functions.md` as an amendment.

---

## Admin UI — Settings page

### Design specification

The `/admin/settings` page becomes a single-section form — no tabs, no accordion. The form uses the exact same component patterns as `AdminServicesPage.tsx` and `AdminAvailabilityPage.tsx`.

**Layout (top → bottom):**

1. **Page heading + intro** — existing `adminCopy.settings.heading` / `adminCopy.settings.intro` (update copy, see below)
2. **Company Information form card** — white surface, `padding: 24px`, section heading "Información del negocio"
3. **Two-column field grid** on desktop, single-column on mobile (use Tailwind grid)
4. **Save button** — primary, right-aligned, with loading state; success toast on save

**Form fields (in order):**

| Field | Label (Spanish) | Input type | Validation |
|-------|-----------------|------------|------------|
| `businessName` | Nombre del negocio | text | Required |
| `phone` | Teléfono | tel | Required |
| `email` | Email de contacto | email | Required, basic format |
| `address.street` | Calle y número | text | Required |
| `address.city` | Ciudad | text | Required |
| `address.postalCode` | Código postal | text | Required |
| `address.country` | País | text | Required |
| `hours` | Horario de atención | text | Optional |
| `logoUrl` | URL del logo | url | Optional |
| `whatsapp` | WhatsApp | tel | Optional, hint: international format |

**UX rules:**

- On mount: `GET /api/admin/company-profile` → populate form fields; if `null` (no data yet), render empty form with placeholder text
- All required fields show `*` indicator in label (WCAG 3.3.2)
- Client-side validation fires on submit, not on blur — do not add per-field inline errors until submit is attempted
- On validation error: show an `Alert` above the form with a summary message listing missing fields (do not use browser `alert()`)
- Save button shows a loading spinner during the PUT request; disable to prevent double submission
- On success: show a success toast matching the `adminCopy.availability.scheduleSaved` pattern
- On API error: show an `Alert` with the error message from the response body

**Accessibility requirements:**

- Every `<input>` has a corresponding `<label>` with matching `htmlFor`/`id` (WCAG 3.3.2)
- Required fields use `aria-required="true"` on the input
- Error `Alert` receives `role="alert"` so screen readers announce it
- Save button focus order is last in the form (keyboard users reach it after all fields)

### `admin-copy.ts` additions

Add the following keys to the `adminCopy` object:

```typescript
companyProfile: {
  heading: 'Información del negocio',
  intro: 'Los datos de tu negocio se utilizan en el pie de página, la cabecera, los metadatos del sitio y los bloques de contacto.',
  form: {
    businessName: 'Nombre del negocio',
    phone: 'Teléfono',
    email: 'Email de contacto',
    street: 'Calle y número',
    city: 'Ciudad',
    postalCode: 'Código postal',
    country: 'País',
    hours: 'Horario de atención',
    logoUrl: 'URL del logo',
    whatsapp: 'WhatsApp',
    whatsappHint: 'Formato internacional, ej. +34 611 234 567.',
    saveButton: 'Guardar cambios',
    saveSuccess: 'Información del negocio actualizada.',
    saveError: 'No se pudo guardar. Inténtalo de nuevo.',
    validationError: 'Por favor completa los campos obligatorios: ',
    requiredFields: ['Nombre del negocio', 'Teléfono', 'Email de contacto', 'Calle y número', 'Ciudad', 'Código postal', 'País'],
  },
},
```

Also update `adminCopy.settings.intro` to:
```
'Gestiona la información pública de tu negocio: nombre, contacto y horario.'
```

### New component — `AdminCompanyProfileForm.tsx`

Location: `components/admin/AdminCompanyProfileForm.tsx`

This component owns the form state (no external state management). It receives no props; it fetches its own data on mount via `adminFetch`. It is the only component imported by `app/admin/(dashboard)/settings/page.tsx`.

---

## Public site integration

### Abstraction — `lib/company-profile.ts`

Create a server-side helper that provides a consistent interface regardless of storage backend:

```typescript
// lib/company-profile.ts
export async function getCompanyProfile(clientId: string): Promise<CompanyProfile | null>
```

- **Local dev** (when `NEXT_PUBLIC_ADMIN_API_URL` is not set): reads from `data/company-profile-local.json`
- **Production** (when `NEXT_PUBLIC_ADMIN_API_URL` is set): fetches from the Azure Function `GET /admin/company-profile` using an internal service token (or reads directly from Cosmos SDK if available in the Next.js build context)
- Returns `null` if no profile exists — callers must handle gracefully

### Where to call `getCompanyProfile`

| Surface | File | Change |
|---------|------|--------|
| Site layout (navbar logo, footer) | `app/(site)/layout.tsx` | Call `getCompanyProfile(clientId)` and pass `businessName` as fallback for `header.logo` if `CompanyProfile.businessName` is set; pass `CompanyProfile.phone`, `email` into footer columns if profile exists |
| JSON-LD | `lib/json-ld.ts` | Add `telephone`, `email`, `address` (PostalAddress schema.org) from `CompanyProfile` if available |
| `bottomActionBar` | `app/(site)/layout.tsx` | If `CompanyProfile.phone` is set, ensure the `tel:` item href uses it; if `CompanyProfile.whatsapp` is set, render a WhatsApp link item |
| `contactInfoBlock` renderer | `components/blocks/ContactInfoBlock.tsx` | Accept `CompanyProfile` fields as fallback props when block's own fields are null/empty |
| `location` block | `components/blocks/LocationBlock.tsx` | Accept `CompanyProfile.address` as fallback for display address text |

**Fallback strategy (non-breaking):** `CompanyProfile` values are always applied as fallbacks — if the block or layout already has explicit field values from `client.json` or page JSON, those take precedence. This ensures existing clients are unaffected until they save a profile.

### Dev server behaviour

In Next.js dev mode, server components and Route Handlers re-execute on each request with no caching. This means:

1. Admin saves company profile via `PUT /api/admin/company-profile` → writes `data/company-profile-local.json`
2. User refreshes the public site page → `getCompanyProfile()` reads the updated file → UI reflects the new data

No rebuild is needed in local development. Changes are visible immediately on the next page load.

### Production (SSG) behaviour

Static builds are point-in-time snapshots. After saving a company profile in the admin:

- **Public site does not update automatically.** A redeploy/rebuild is required.
- A platform operator should trigger a rebuild via CI/CD after any company profile save, or configure a webhook (out of scope for this task).
- Document this limitation in the admin form with an informational note below the save button: `"Los cambios se reflejarán en el sitio público tras el siguiente despliegue."`

---

## Files touched

| Area | Path | Change |
|------|------|--------|
| Type definition | `types/admin.ts` | Add `CompanyProfile` type |
| Local DB helper | `lib/company-profile-db.ts` | New file |
| Public site helper | `lib/company-profile.ts` | New file |
| Admin API route | `app/api/admin/company-profile/route.ts` | New file |
| Admin form component | `components/admin/AdminCompanyProfileForm.tsx` | New file |
| Settings page | `app/admin/(dashboard)/settings/page.tsx` | Replace placeholder with `<AdminCompanyProfileForm />` |
| Admin copy | `components/admin/admin-copy.ts` | Add `companyProfile` key; update `settings.intro` |
| Site layout | `app/(site)/layout.tsx` | Call `getCompanyProfile`, merge into navbar + footer |
| JSON-LD | `lib/json-ld.ts` | Add `telephone`, `email`, `address` from profile |
| Contact block | `components/blocks/ContactInfoBlock.tsx` | Accept profile fallback props |
| Location block | `components/blocks/LocationBlock.tsx` | Accept profile fallback address |
| Bottom action bar | `app/(site)/layout.tsx` | Merge `phone` + `whatsapp` from profile |
| Dev data file | `data/company-profile-local.json` | Created on first save; seeded for hair-salon in dev |
| Cosmos container | Azure Portal / `03-setup-cosmos-db-admin-containers.md` | Add `client-profile` container |
| Azure Functions | `azure-functions/src/functions/admin/companyProfile.ts` | New GET + PUT handlers |

---

## Out of scope

- Theme / color settings (separate admin UI; `client.json` `theme` field; task 17)
- Domain / hosting management — platform-operator responsibility, not merchant-editable
- Social media profile links beyond WhatsApp (can be added later as optional fields)
- Logo image upload — `logoUrl` accepts an external URL only; blob upload is a separate feature
- Multi-admin user management — one admin per client for now (task 03 model)
- Automatic rebuild trigger on profile save — documented as a limitation; CI webhook is a future task

---

## Acceptance criteria

1. Navigating to `/admin/settings` renders a form with all 10 fields, pre-populated with existing data on load (or empty on first visit)
2. Submitting the form without all required fields shows a Spanish-language error `Alert` listing the missing fields — no browser `alert()`
3. Submitting a valid form calls `PUT /api/admin/company-profile`, writes to `data/company-profile-local.json`, and shows the success toast
4. Reloading `/admin/settings` after a save shows the previously saved values in all fields
5. In local dev: refreshing any public site page after a save reflects the updated `businessName` in the navbar logo (if it was previously null/placeholder) and `phone` in the footer contact column
6. `GET /api/admin/company-profile` returns `{ profile: null }` when `data/company-profile-local.json` does not exist (no crash)
7. `PUT /api/admin/company-profile` without a valid `admin-session` cookie returns `401`
8. `PUT /api/admin/company-profile` with a missing required field returns `422` with a descriptive error message
9. All form inputs have visible labels that match their accessible names (WCAG 2.5.3) — verified by inspecting the DOM
10. `npm run build` for the public site exits 0 with the new `getCompanyProfile` integration in place
11. `npm run build` inside `azure-functions/` exits 0 after adding the new Function handlers
