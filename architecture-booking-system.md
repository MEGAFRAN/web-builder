# Bookings Architecture

Feature-level architecture for reservations: the public booking widget, admin portal, Route Handlers, and local (or upstream) persistence. For platform-wide build flow, client config, and blocks, see [`architecture.md`](architecture.md).

---

## Goal

Each tenant (`CLIENT_ID`) exposes:

1. **Public booking** — a multi-step `reservationBlock` on CMS pages where visitors pick a service, date/time, and contact details.
2. **Admin portal** — authenticated routes under `/admin` to manage the service catalog, weekly/date-specific availability, and the appointment calendar.

The admin portal is a **client-side SPA** (no server rendering). It is designed to be deployed once and serve all tenants — the active tenant is identified from the authenticated user's session, not from `CLIENT_ID` at build time.

---

## System Overview

```
PUBLIC SITE (static blob)
────────────────────────────────────────────────────────────────────
CMS page (SSG)
  reservationBlock ──fetch──► GET /api/booking-services (catalog)
                │              GET /api/availability (slots)
                └─POST────────► POST /api/reservation
                                       │
                     reservationEndpoint set? ──yes──► Azure Function (Cosmos)
                                       │
                                      no
                                       ▼
                            data/reservations-local.json


ADMIN SPA (separate deployment — not included in public blob builds)
────────────────────────────────────────────────────────────────────
app/admin/* (all "use client")
  AdminAuthProvider (lib/admin-auth-context.tsx)
    │  bootstrap: GET /auth/me ────────────────────────────────────┐
    │  login:     POST /auth/login                                  │
    │  shell:     GET /clients/:clientId/config                     │
    │                                                               │
    └── NEXT_PUBLIC_ADMIN_API_URL set?                             │
          yes ──► Azure Functions (multi-tenant Cosmos DB)  ◄──────┘
          no  ──► local Next.js Route Handlers (/api/admin/*)
                  └── data/*.json  (dev only)
```

**Build targets:**

| Command | Output | Includes | Excludes |
|---|---|---|---|
| `npm run build:blob` | `/out` (static, trailing slash) | public site routes only | `app/api/`, `app/admin/` |
| `npm run build:admin` | `/out` (static) | `app/admin/` only | `app/api/`, `app/(site)/` |
| `npm run dev` | dev server | everything | nothing |

The pre-build scripts (`scripts/prepare-static-export.mjs`, `scripts/prepare-admin-export.mjs`) temporarily move excluded directories outside `app/` before calling `next build`, then restore them on exit — including on failure.

---

## Admin Routes (`app/admin`)

All admin pages and layouts are `"use client"` components. There are no server components or server-side data fetches in the admin surface.

```
app/admin/
  layout.tsx                    # AdminAuthProvider wrapper (client)
  login/
    page.tsx                    # AdminLoginForm (public)
  (dashboard)/
    layout.tsx                  # auth guard + AdminShell (client)
    page.tsx                    # redirect → /admin/bookings
    bookings/page.tsx           # AdminBookingsPage
    services/page.tsx           # AdminServicesPage
    availability/page.tsx       # AdminAvailabilityPage
    settings/page.tsx           # placeholder copy
```

| Route | Page component | Purpose |
|-------|----------------|---------|
| `/admin` | redirect | Lands on `/admin/bookings` |
| `/admin/login` | `AdminLoginForm` | Email/password + clientId login |
| `/admin/bookings` | `AdminBookingsPage` | Day/week calendar, detail drawer, manual appointments |
| `/admin/services` | `AdminServicesPage` | CRUD + drag reorder of bookable services |
| `/admin/availability` | `AdminAvailabilityPage` | Weekly hours + per-date exceptions |
| `/admin/settings` | static section | Reserved; no API yet |

### Auth layout (`app/admin/layout.tsx`)

Wraps all admin routes in `AdminAuthProvider`. This is the single mount point for the auth context — it is `"use client"` and has no other markup.

### Dashboard layout (`app/admin/(dashboard)/layout.tsx`)

Reads `session` and `status` from `useAdminAuth()`. While loading, shows a loading state. When `status === 'unauthenticated'`, redirects to `/admin/login?redirect=<current path>` via `useRouter`. Once authenticated, renders `<AdminShell>`.

`AdminShell` no longer receives `businessName` / `logoUrl` as server-side props. It fetches them from `adminClientConfigUrl(clientId)` on mount using the `clientId` from the auth context.

### Shell & navigation

`AdminShell` (`components/admin/AdminShell.tsx`):

- Sidebar (desktop) and bottom tab bar + drawer (mobile)
- Nav items: Bookings, Services, Availability, Settings
- Sign-out → `adminAuthUrl('logout')` → clears session → `/admin/login`
- Fetches client `displayName` + `logoUrl` from `adminClientConfigUrl()` on mount
- Full-width main container on **bookings** and **availability** routes

### Bookings UI composition

`AdminBookingsPage` orchestrates subcomponents under `components/admin/bookings/`:

| Component | Role |
|-----------|------|
| `CalendarNavBar` | Date picker, day/week toggle |
| `DayTimeline` | Time-positioned cards for one day (uses schedule window) |
| `WeekGrid` | Seven-day summary; click day → day view |
| `SimpleDayList` | Fallback list when day is "closed" in schedule but reservations exist |
| `CalendarEmptyState` | Empty or closed-day CTA |
| `BookingDetailDrawer` | View booking; cancel / no-show actions |
| `NewAppointmentModal` | Manual booking via admin API + availability slots |

Shared helpers: `lib/booking-utils.ts` (dates), `lib/booking-schedule-window.ts` (open/close minutes per day).

---

## Authentication

### Client-side session: `AdminAuthContext`

`lib/admin-auth-context.tsx` provides session state to all admin components via React context.

```
AdminAuthProvider (mounts once in app/admin/layout.tsx)
  │
  ├── on mount: read sessionStorage['admin-session-v1']
  │     found → call GET /auth/me to validate
  │               200 → status: 'authenticated', update sessionStorage
  │               401 → status: 'unauthenticated', clear sessionStorage
  │     not found → status: 'unauthenticated'
  │
  ├── setSession(info)  → write sessionStorage, set status: 'authenticated'
  ├── signOut()         → POST /auth/logout, clear sessionStorage, redirect to /admin/login
  └── 401 handler       → setAdminUnauthorizedHandler → clear session, redirect to /admin/login
```

Session state is stored in `sessionStorage` (cleared on tab close). On refresh, the bootstrap effect re-validates with `GET /auth/me`.

### `AdminAuthContext` API

| Export | Purpose |
|--------|---------|
| `AdminAuthProvider` | Wraps admin routes; mounts the context |
| `useAdminAuth()` | Returns `{ session, status, setSession, signOut }` |

`session` shape: `{ email: string, clientId: string }`.  
`status`: `'loading' | 'authenticated' | 'unauthenticated'`.

### Edge gate: `proxy.ts`

Next.js 16 **proxy** (formerly middleware) still protects admin pages and APIs for **local dev** (`npm run dev`):

- Pages: `/admin`, `/admin/bookings`, `/admin/services`, `/admin/availability`, `/admin/settings`
- APIs: `/api/admin/*` except `/api/admin/auth/*`

Unauthenticated browser requests redirect to `/admin/login?redirect=…`. API requests return `401`. Missing `ADMIN_JWT_SECRET` or `CLIENT_ID` redirects with `?error=misconfigured`.

The proxy is not present in static export builds. Client-side auth guards in the dashboard layout handle route protection in the deployed admin SPA.

### Login & session (local dev)

| Item | Detail |
|------|--------|
| Login | `POST /api/admin/auth/login` — body `{ email, password }` |
| Env | `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_JWT_SECRET`, `CLIENT_ID` |
| Cookie | `admin-session` (`ADMIN_SESSION_COOKIE`), httpOnly JWT, 7-day maxAge |
| Token | HS256 JWT — see `lib/admin-session.ts` |
| Payload | `{ email, clientId, exp }` — clientId sourced from `CLIENT_ID` env var |
| API guard | `requireAdminSession()` in each `/api/admin/*` route handler |

Logout: `POST /api/admin/auth/logout` clears the cookie.

### Dual-mode API (`lib/admin-api.ts`)

All admin data fetches go through `lib/admin-api.ts`, which switches between local Route Handlers and Azure Functions based on `NEXT_PUBLIC_ADMIN_API_URL`:

```typescript
// NEXT_PUBLIC_ADMIN_API_URL not set (local dev)
adminAuthUrl('login')          → /api/admin/auth/login
adminAuthUrl('me')             → /api/admin/auth/me
adminDataUrl('/reservations')  → /api/admin/reservations
adminClientConfigUrl(clientId) → /api/admin/client-config

// NEXT_PUBLIC_ADMIN_API_URL = 'https://fn.example.com' (deployed)
adminAuthUrl('login')          → https://fn.example.com/auth/login
adminAuthUrl('me')             → https://fn.example.com/auth/me
adminDataUrl('/reservations')  → https://fn.example.com/admin/reservations
adminClientConfigUrl(clientId) → https://fn.example.com/clients/1/config
```

`adminFetch()` wraps `fetch` with `credentials: 'include'` and fires the global 401 handler when a response status is 401.

---

## Public Booking (`reservationBlock`)

Registered in the block system (`_type: "reservationBlock"`). Schema: [`config/schemas/blocks/reservationBlock.schema.json`](config/schemas/blocks/reservationBlock.schema.json).

### Service catalog precedence

1. On mount, `GET /api/booking-services` (optionally `?clientId=` must match deployment when both set).
2. If the admin catalog has **one or more** services → use those.
3. Else → use optional `services` from page JSON (CMS fallback).
4. While loading with no fallback → short loading state (no stale placeholders).

### Booking flow (4 steps)

1. **Service** — duration drives slot length for availability.
2. **Date & time** — `GET /api/availability?clientId=&date=&duration=` (or `availabilityEndpoint` from block props).
3. **Details** — name, email, phone, notes.
4. **Confirmed** — `POST /api/reservation` with `serviceId`, `durationMinutes`, contact fields, `date`, `time`.

Slot grid is fixed in `lib/booking-slot-grid.ts` (`BOOKING_SLOT_GRID`). Availability marks slots as `bookedSlots` or `outOfWindowSlots` (outside weekly/exception hours or overlapping existing bookings). Cancelled and no-show bookings do not block slots.

### Client config hooks

In `config/clients/{clientId}/client.json`:

```json
{
  "features": { "booking": true },
  "reservationEndpoint": "https://<function-app>.azurewebsites.net/api/reservations"
}
```

Block-level overrides:

- `clientId` — must align with `CLIENT_ID` for built-in APIs.
- `availabilityEndpoint` — optional external GET for slots (same query shape as `/api/availability`).

Enable booking on a site by adding a page with `reservationBlock` (e.g. template `restaurant-standard` includes `/reservas`).

---

## Data Model

Types live in [`types/admin.ts`](types/admin.ts).

### `AdminBookingService`

```typescript
{
  id: string
  name: string
  description: string
  durationMinutes: number   // 1–1440
  price: number             // >= 0
  currency: string          // e.g. "€"
}
```

### `StoredReservation` / `ReservationRow`

```typescript
{
  id: string
  clientId: string
  serviceId?: string
  durationMinutes?: number
  name: string
  email: string
  phone: string
  date: string              // YYYY-MM-DD
  time: string              // HH:mm
  notes?: string | null
  status: string            // confirmed | pending | cancelled | no-show
  createdAt: string         // ISO
  partySize?: number        // legacy table bookings
  cancelReason?: string | null
}
```

`ReservationRow` adds `serviceName` (resolved in admin list API from services catalog).

### `BookingScheduleFile`

```typescript
{
  weekly: WeeklyHoursRow[]     // exactly 7 rows, mon–sun
  exceptions: ScheduleException[]
}

WeeklyHoursRow = { day: DayCode, open: boolean, from: string, to: string }
ScheduleException = { id, date, closed: boolean, from?: string, to?: string }
```

**Resolution order** for a calendar date (`lib/booking-schedule-window.ts`):

1. Date exception with `closed: true` → closed all day.
2. Date exception with custom `from`/`to` → that window.
3. Else weekly row for weekday (`dayCodeFromYmd`) → if `open`, use `from`/`to`; else closed.

Default weekly template when file missing: Mon–Sat 09:00–21:00, Sun closed (`DEFAULT_WEEKLY` in `lib/booking-schedule-db.ts`).

---

## Persistence (`data/`)

**Local dev only.** Per-deployment JSON files (not committed per client in Git):

| File | Writer | Reader |
|------|--------|--------|
| `data/booking-services-local.json` | `PUT /api/admin/services` | Admin + `GET /api/booking-services` |
| `data/booking-schedule-local.json` | `PUT/POST/DELETE /api/admin/schedule` | Admin + `GET /api/availability` |
| `data/reservations-local.json` | `POST /api/reservation`, admin reservation routes | Admin + `GET /api/availability` |

Access layer:

| Module | Path constant |
|--------|----------------|
| `lib/booking-services-db.ts` | `booking-services-local.json` |
| `lib/booking-schedule-db.ts` | `booking-schedule-local.json` |
| `lib/reservations-db.ts` | `reservations-local.json` |

**Production / deployed:** data is stored in Azure Cosmos DB, accessed via Azure Functions. The local JSON files and `*-db.ts` modules are dev stubs only and will be retired when the Azure Functions backend is stable.

---

## HTTP API Reference

### Public (unauthenticated)

| Method | Route | Query / body | Response |
|--------|-------|--------------|----------|
| GET | `/api/booking-services` | `?clientId=` optional | `{ services }` — 404 empty if clientId mismatch |
| GET | `/api/availability` | `clientId`, `date`, `duration?` (default 60) | `{ bookedSlots, outOfWindowSlots }` |
| POST | `/api/reservation` | Reservation payload | `{ ok: true }` or upstream error |

`POST /api/reservation`: if `client.json` → `reservationEndpoint` is set, forwards `{ clientId, ...body }` to that URL; otherwise appends to local JSON with `status: 'confirmed'`.

### Admin (session required) — local Route Handlers

These Route Handlers are active during `npm run dev` and used by the admin SPA when `NEXT_PUBLIC_ADMIN_API_URL` is not set.

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/admin/auth/me` | Return `{ email, clientId }` for the current session — used by `AdminAuthContext` bootstrap |
| POST | `/api/admin/auth/login` | Issue session cookie |
| POST | `/api/admin/auth/logout` | Clear cookie |
| GET | `/api/admin/client-config` | Return `{ displayName, logoUrl }` for the session's `clientId` |
| GET | `/api/admin/services` | List catalog |
| PUT | `/api/admin/services` | Replace entire `{ services }` array |
| GET | `/api/admin/schedule` | Full schedule file |
| PUT | `/api/admin/schedule` | Replace `weekly` (7 rows, mon–sun) |
| POST | `/api/admin/schedule` | Add/replace date exception |
| DELETE | `/api/admin/schedule?id=` | Remove exception by id |
| GET | `/api/admin/reservations` | `startDate`, `endDate` (YYYY-MM-DD) → enriched list |
| POST | `/api/admin/reservations` | Manual booking (`status: confirmed`) |
| PATCH | `/api/admin/reservations/[id]` | `{ action: 'cancel' \| 'no-show', reason? }` |

### Admin — Azure Functions (deployed)

When `NEXT_PUBLIC_ADMIN_API_URL` is set, the admin SPA calls Azure Functions instead. The endpoint shape mirrors the local Route Handlers; the URL prefix changes. See [`azure-functions/README.md`](azure-functions/README.md) and `business/tasks/04-implement-admin-azure-functions.md` for the full specification.

---

## Availability & Conflict Logic

Shared slot grid: `BOOKING_SLOT_GRID` in `lib/booking-slot-grid.ts`.

For each slot start time `S` and requested duration `D`:

1. **`outOfWindowSlots`** — `!slotFitsScheduleWindow(schedule, date, minutes(S), D)` (appointment must fit entirely inside the day window).
2. **`bookedSlots`** — overlaps any non-cancelled reservation for same `clientId` + `date` (interval overlap on minute timeline; legacy rows without `durationMinutes` use 60 minutes).

Admin calendar timeline uses `resolveDayMinutesWindow` for vertical scale (pixels per minute ≈ 1.15 in `AdminBookingsPage`).

---

## Environment Variables

| Variable | Used by | Required for |
|----------|---------|----------------|
| `CLIENT_ID` | Build, all public booking APIs, local admin session binding | Every deployment |
| `ADMIN_JWT_SECRET` | Login, proxy, `requireAdminSession` | Local dev admin portal |
| `ADMIN_EMAIL` | Login (local) | Local dev admin portal |
| `ADMIN_PASSWORD` | Login (local) | Local dev admin portal |
| `NEXT_PUBLIC_ADMIN_API_URL` | `lib/admin-api.ts` URL switching | Deployed admin SPA — baked into bundle at build time |

`NEXT_PUBLIC_ADMIN_API_URL` absent → all admin fetches go to local Next.js Route Handlers.  
`NEXT_PUBLIC_ADMIN_API_URL` set → all admin fetches go to Azure Functions.

Optional upstream (Function App): `COSMOS_DB_ENDPOINT`, `COSMOS_DB_KEY`, `ADMIN_JWT_SECRET` — see [`azure-functions/README.md`](azure-functions/README.md).

Local dev example:

```bash
npm run dev restaurante-pepe
# sets CLIENT_ID=restaurante-pepe via scripts/run-next-dev.mjs
```

---

## File Map (for agents)

When changing bookings, start from the route or API you touch:

```
app/admin/                          # routes (all "use client")
  layout.tsx                        # AdminAuthProvider wrapper
  login/page.tsx
  (dashboard)/
    layout.tsx                      # auth guard + AdminShell
    page.tsx | bookings/ | services/ | availability/ | settings/

app/api/
  booking-services/route.ts         # public
  availability/route.ts             # public
  reservation/route.ts              # public
  admin/
    auth/
      login/route.ts                # local dev: issue session cookie
      logout/route.ts               # local dev: clear cookie
      me/route.ts                   # local dev: return { email, clientId }
    client-config/route.ts          # local dev: return { displayName, logoUrl }
    services/route.ts
    schedule/route.ts
    reservations/route.ts
    reservations/[id]/route.ts

components/
  blocks/ReservationBlock.tsx
  admin/
    AdminShell.tsx                  # fetches client config via adminClientConfigUrl()
    AdminBookingsPage.tsx
    AdminServicesPage.tsx
    AdminAvailabilityPage.tsx
    AdminLoginForm.tsx              # calls adminAuthUrl('login')
    admin-copy.ts
    admin-locale.ts
    bookings/                       # calendar UI pieces

lib/
  admin-api.ts                      # URL helpers + adminFetch (dual-mode)
  admin-auth-context.tsx            # AdminAuthProvider + useAdminAuth()
  admin-session.ts                  # JWT sign/verify (local dev)
  admin-session-constants.ts
  require-admin.ts                  # requireAdminSession() for Route Handlers
  booking-services-db.ts            # local dev: read/write services JSON
  booking-schedule-db.ts            # local dev: read/write schedule JSON
  booking-schedule-utils.ts
  booking-schedule-window.ts
  booking-slot-grid.ts
  booking-utils.ts
  reservations-db.ts                # local dev: read/write reservations JSON

scripts/
  prepare-static-export.mjs        # blob build: excludes app/api + app/admin
  prepare-admin-export.mjs         # admin build: excludes app/api + app/(site)

types/admin.ts
proxy.ts                            # admin auth gate (Next 16, local dev only)
data/*.json                         # local persistence (dev only)
config/schemas/blocks/reservationBlock.schema.json
```

Tests are colocated under `__tests__/` mirroring the above paths.

---

## Agent Conventions

- Read [`architecture.md`](architecture.md) for tenant config, theming, and block registry rules.
- Admin UI: all components are `"use client"`. Never add server-side data fetching to `app/admin/` pages.
- All admin data fetches must go through `adminFetch()` from `lib/admin-api.ts` — never call `/api/admin/*` directly in components.
- `clientId` in admin components must always come from `useAdminAuth().session.clientId` — never from `process.env.CLIENT_ID`.
- Admin UI: Tailwind + existing layout/content components; copy in `components/admin/admin-copy.ts` (Spanish strings).
- Do not add npm packages without explicit instruction.
- After substantive TS changes: `npx tsc --noEmit` and `npm run test`.
- Service catalog changes affect both admin and public widget — keep `AdminBookingService` and `reservationBlock` schema fields aligned.
- Persisted JSON in `data/` is per deployment; never assume cross-client sharing.

---

## Related Docs

| Doc | Topic |
|-----|--------|
| [`architecture.md`](architecture.md) | Multi-tenant SSG, `ClientConfig`, runtime APIs summary |
| [`docs/blocks.md`](docs/blocks.md) | Block registry and page JSON |
| [`azure-functions/README.md`](azure-functions/README.md) | Production Cosmos + email |
| [`business/tasks/04-implement-admin-azure-functions.md`](business/tasks/04-implement-admin-azure-functions.md) | Admin Azure Functions specification |
| [`business/tasks/refactor-admin-multitenant-spa.md`](business/tasks/refactor-admin-multitenant-spa.md) | Multi-tenant admin SPA design decision record |
