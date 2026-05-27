# Bookings Architecture

Feature-level architecture for reservations: the public booking widget, admin portal, Route Handlers (local dev), and Azure Functions (production). For platform-wide build flow, client config, and blocks, see [`architecture.md`](architecture.md).

---

## Goal

Each tenant (`CLIENT_ID`) exposes:

1. **Public booking** — a multi-step `reservationBlock` on CMS pages where visitors pick a service, date/time, contact details, and (optionally) card-on-file for a no-show guarantee.
2. **Admin portal** — authenticated routes under `/admin` to manage the service catalog, weekly/date-specific availability, the appointment calendar, company profile, and Stripe Connect onboarding.

The admin portal is a **client-side SPA** (no server rendering). It is designed to be deployed once and serve all tenants — the active tenant is identified from the authenticated user's session, not from `CLIENT_ID` at build time.

---

## System Overview

```
LOCAL DEV (npm run dev)
────────────────────────────────────────────────────────────────────
reservationBlock ──fetch──► GET  /api/booking-services
                │           GET  /api/availability
                │           GET  /api/setup-intent        (if guarantee)
                └─POST────► POST /api/reservation
                                   │
                     reservationEndpoint set? ──yes──► Azure Function
                                   │
                                  no
                                   ▼
                            data/reservations-local.json

Admin SPA ──► /api/admin/*  (Route Handlers + data/*.json)


PRODUCTION — public static site (blob / SWA)
────────────────────────────────────────────────────────────────────
Static export has NO Route Handlers (app/api/ excluded from build).
The widget calls Azure Functions directly via lib/booking-api.ts,
using NEXT_PUBLIC_BOOKING_API_URL baked in at build time.

reservationBlock ──fetch──► GET  {BOOKING_API}/booking-services?clientId=
                │           GET  {BOOKING_API}/availability?clientId=&date=&duration=
                │           GET  {BOOKING_API}/setup-intent?clientId=&email=
                └─POST────► POST {BOOKING_API}/reservations
                                   body includes clientId (required upstream)


PRODUCTION — admin SPA (separate deploy)
────────────────────────────────────────────────────────────────────
app/admin/* (all "use client")
  AdminAuthProvider
    │  bootstrap: GET  /auth/me
    │  login:     POST /auth/login  → stores Bearer token in sessionStorage
    │  data:      GET/POST /mgmt/*  (via adminDataUrl)
    │
    └── NEXT_PUBLIC_ADMIN_API_URL set?
          yes ──► Azure Functions (Cosmos DB, multi-tenant)
          no  ──► local /api/admin/* (dev only)
```

**Build targets:**

| Command | Output | Includes | Excludes |
|---|---|---|---|
| `npm run build:blob` | `/out` (static, trailing slash) | public site routes only | `app/api/`, `app/admin/` |
| `npm run build:admin` | `/out` (static) | `app/admin/` only | `app/api/`, `app/(site)/` |
| `npm run dev` | dev server | everything | nothing |

The pre-build scripts (`scripts/prepare-static-export.mjs`, `scripts/prepare-admin-export.mjs`) temporarily move excluded directories outside `app/` before calling `next build`, then restore them on exit — including on failure.

**Critical production rule:** POST requests to `/api/reservation` or `/api/availability` on the **static site origin** will fail with **405** (blob storage only supports GET/HEAD). Production widgets must use `NEXT_PUBLIC_BOOKING_API_URL` pointing at the Function App.

---

## Dual-mode public booking API (`lib/booking-api.ts`)

All public booking fetches from the browser go through URL helpers in `lib/booking-api.ts`, mirroring the admin dual-mode pattern in `lib/admin-api.ts`.

| Helper | Local dev (no env) | Production (`NEXT_PUBLIC_BOOKING_API_URL` set) |
|--------|-------------------|-----------------------------------------------|
| `bookingServicesUrl(clientId, override?)` | `/api/booking-services?clientId=` | `{base}/booking-services?clientId=` |
| `availabilityUrl(clientId, override?)` | `/api/availability` | `{base}/availability` |
| `reservationUrl(override?)` | `/api/reservation` | `{base}/reservations` |
| `setupIntentUrl(clientId)` | `/api/setup-intent?clientId=` | `{base}/setup-intent?clientId=` |
| `isRemoteBookingApi()` | `false` | `true` when remote base or baked services endpoint is set |

**Precedence for services catalog:** block `servicesEndpoint` override → `NEXT_PUBLIC_BOOKING_SERVICES_ENDPOINT` (from `client.json` at build) → `{BOOKING_API}/booking-services` → local Route Handler.

**Remote reservation POST:** when `isRemoteBookingApi()` is true, `ReservationBlock` includes `clientId` in the JSON body (the Azure Function requires it). Local `/api/reservation` injects `clientId` server-side from `CLIENT_ID` env.

**Build-time env (public blob deploy):** GitHub Actions sets `NEXT_PUBLIC_BOOKING_API_URL` from the repo variable `ADMIN_API_URL` (same Function App base URL as the admin SPA, including `/api` prefix if used). See `.github/workflows/deploy-blob-storage.yml`.

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
    settings/page.tsx           # company profile + Stripe Connect
```

| Route | Page component | Purpose |
|-------|----------------|---------|
| `/admin` | redirect | Lands on `/admin/bookings` |
| `/admin/login` | `AdminLoginForm` | Email/password + clientId login |
| `/admin/bookings` | `AdminBookingsPage` | Day/week calendar, detail drawer, manual appointments, charge no-show |
| `/admin/services` | `AdminServicesPage` | CRUD + drag reorder of bookable services |
| `/admin/availability` | `AdminAvailabilityPage` | Weekly hours + per-date exceptions |
| `/admin/settings` | `AdminCompanyProfileForm` + `AdminStripeConnectSection` | Company profile (SSG) + Stripe Connect onboarding |

### Auth layout (`app/admin/layout.tsx`)

Wraps all admin routes in `AdminAuthProvider`. This is the single mount point for the auth context — it is `"use client"` and has no other markup.

### Dashboard layout (`app/admin/(dashboard)/layout.tsx`)

Reads `session` and `status` from `useAdminAuth()`. While loading, shows a loading state. When `status === 'unauthenticated'`, redirects to `/admin/login?redirect=<current path>` via `useRouter`. Once authenticated, renders `<AdminShell>`.

`AdminShell` fetches `displayName` + `logoUrl` from `adminClientConfigUrl(clientId)` on mount using the `clientId` from the auth context.

### Shell & navigation

`AdminShell` (`components/admin/AdminShell.tsx`):

- Sidebar (desktop) and bottom tab bar + drawer (mobile)
- Nav items: Bookings, Services, Availability, Settings
- Sign-out → `adminAuthUrl('logout')` → clears session → `/admin/login`
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
| `BookingDetailDrawer` | View booking; cancel / no-show / charge no-show actions |
| `NewAppointmentModal` | Manual booking via admin API + availability slots |

Shared helpers: `lib/booking-utils.ts` (dates), `lib/booking-schedule-window.ts` (open/close minutes per day).

---

## Authentication

### Client-side session: `AdminAuthContext`

`lib/admin-auth-context.tsx` provides session state to all admin components via React context.

```
AdminAuthProvider (mounts once in app/admin/layout.tsx)
  │
  ├── on mount: read sessionStorage['admin-bearer-token-v1'] OR validate via GET /auth/me
  │     found → call GET /auth/me to validate
  │               200 → status: 'authenticated'
  │               401 → status: 'unauthenticated', clear token
  │     not found → status: 'unauthenticated'
  │
  ├── login success → setAdminToken(jwt) in sessionStorage
  ├── signOut()         → POST /auth/logout, clear token, redirect to /admin/login
  └── 401 handler       → setAdminUnauthorizedHandler → clear token, redirect
```

**Cross-origin auth:** Azure Static Web Apps (free tier) blocks third-party cookies on cross-origin requests to the Function App. Production admin uses `Authorization: Bearer <jwt>` (stored in `sessionStorage` as `admin-bearer-token-v1`) in addition to the `admin-session` cookie. `adminFetch()` attaches the Bearer header when present. Azure Functions `validateAdminJwt()` accepts Bearer first, then falls back to cookie.

### Edge gate: `proxy.ts`

Next.js 16 **proxy** (formerly middleware) still protects admin pages and APIs for **local dev** (`npm run dev`):

- Pages: `/admin/*` (except login)
- APIs: `/api/admin/*` except `/api/admin/auth/*`

The proxy is not present in static export builds. Client-side auth guards in the dashboard layout handle route protection in the deployed admin SPA.

### Login & session (local dev)

| Item | Detail |
|------|--------|
| Login | `POST /api/admin/auth/login` — body `{ email, password, clientId }` |
| Env | `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_JWT_SECRET`, `CLIENT_ID` |
| Cookie | `admin-session` (`ADMIN_SESSION_COOKIE`), httpOnly JWT, 7-day maxAge |
| Token | HS256 JWT — see `lib/admin-session.ts` |
| Payload | `{ email, clientId, exp }` |
| API guard | `requireAdminSession()` in each `/api/admin/*` route handler |

### Dual-mode admin API (`lib/admin-api.ts`)

All admin data fetches go through `lib/admin-api.ts`:

```typescript
// NEXT_PUBLIC_ADMIN_API_URL not set (local dev)
adminAuthUrl('login')           → /api/admin/auth/login
adminDataUrl('/reservations')   → /api/admin/reservations
adminClientConfigUrl(clientId)  → /api/admin/client-config

// NEXT_PUBLIC_ADMIN_API_URL = 'https://fn.example.com/api' (deployed)
adminAuthUrl('login')           → https://fn.example.com/api/auth/login
adminDataUrl('/reservations')   → https://fn.example.com/api/mgmt/reservations
adminDataUrl('/stripe-connect') → https://fn.example.com/api/mgmt/stripe-connect
adminChargeNoShowUrl()          → https://fn.example.com/api/mgmt/charge-noshow
adminClientConfigUrl(clientId)  → https://fn.example.com/api/clients/{clientId}/config
```

`adminFetch()` wraps `fetch` with `credentials: 'include'`, attaches Bearer token when available, and fires the global 401 handler on 401 responses.

**Tenant scoping:** Azure Functions always read `clientId` from the validated JWT — never from query params or request body for admin data routes.

---

## Public Booking (`reservationBlock`)

Registered in the block system (`_type: "reservationBlock"`). Schema: [`config/schemas/blocks/reservationBlock.schema.json`](config/schemas/blocks/reservationBlock.schema.json).

### Service catalog precedence

1. On mount, fetch services via `bookingServicesUrl()` (unless `buildTimeCatalog` was injected at SSG).
2. If the admin catalog has **one or more** services → use those.
3. Else → use optional `services` from page JSON (CMS fallback).
4. While loading with no fallback → short loading state (no stale placeholders).

### Booking flow

**Standard (4 steps):** Service → Date & time → Details → Confirmed

**With no-show guarantee (5 steps):** Service → Date & time → Details → Card → Confirmed

1. **Service** — duration drives slot length for availability. Variations (duration/price) supported via `ServiceVariation`.
2. **Date & time** — `GET` availability via `availabilityUrl()`. Query: `clientId`, `date` (YYYY-MM-DD), `duration` (minutes, default 60).
3. **Details** — name, email, phone, notes.
4. **Card** (when `bookingSettings.enforceGuarantee === true`) — `ReservationCardCapture` calls `setupIntentUrl()`, confirms SetupIntent via Stripe.js on the tenant's connected account, returns `paymentMethodId` (+ optional `customerId`).
5. **Confirmed** — `POST` via `reservationUrl()` with service, contact, date/time, and guarantee fields when applicable.

Slot grid is fixed in `lib/booking-slot-grid.ts` (`BOOKING_SLOT_GRID`).

### Availability response shape

| Environment | Response | Schedule-aware `outOfWindowSlots` |
|-------------|----------|-----------------------------------|
| Local `/api/availability` | `{ bookedSlots, outOfWindowSlots }` | Yes — reads `booking-schedule-local.json` |
| Azure `GET /availability` | `{ bookedSlots }` | **No** — overlap-only; schedule filtering not yet implemented server-side |

Cancelled and no-show bookings do not block slots (both environments).

### Client config hooks

In `config/clients/{clientId}/client.json`:

```json
{
  "features": { "booking": true },
  "bookingSettings": {
    "enforceGuarantee": true,
    "cancellationFeePercent": 50,
    "currency": "EUR"
  },
  "bookingServicesEndpoint": "https://<optional-override>/api/booking-services",
  "reservationEndpoint": "https://<function-app>.azurewebsites.net/api/reservations"
}
```

| Field | Purpose |
|-------|---------|
| `bookingSettings` | Baked into static pages at build; injected into `reservationBlock` as prop |
| `bookingServicesEndpoint` | Optional full URL override for services catalog (also set as `NEXT_PUBLIC_BOOKING_SERVICES_ENDPOINT` at build) |
| `reservationEndpoint` | Used only by local `POST /api/reservation` Route Handler to forward submissions — **not** used by the static widget (which calls Azure directly via `reservationUrl()`) |

Block-level overrides:

- `clientId` — scopes availability/reservation; resolved via `resolveBuildClientId()`.
- `availabilityEndpoint` — optional external GET base URL (same query shape as `/api/availability`).
- `servicesEndpoint` — optional external GET for catalog.

Enable booking on a site by adding a page with `reservationBlock` (e.g. template `solo-beauty-pro` includes booking).

---

## No-show guarantee & Stripe Connect

When `bookingSettings.enforceGuarantee` is true, the widget collects card-on-file via Stripe SetupIntent before creating the reservation. Admins can charge a no-show penalty later from the booking drawer.

### Prerequisites (tenant admin)

1. **Company profile saved** — email required for Stripe Connect (`GET/PUT /mgmt/company-profile`). Cosmos doc: `{clientId}-profile` in `client-profile` container.
2. **Stripe Connect linked** — `AdminStripeConnectSection` on `/admin/settings`. Creates a **Standard** connected account (`controller.stripe_dashboard.type = 'full'`) with fees paid by the connected account and Stripe liable for losses. Country: ES or CO.
3. **Function App env:** `STRIPE_SECRET_KEY`, optionally `STRIPE_PUBLISHABLE_KEY`, `ADMIN_STRIPE_RETURN_URL`.

### Public card capture flow

```
ReservationCardCapture
  → GET setupIntentUrl() + email
  → Azure POST /setup-intent (creates Customer + SetupIntent on connected account)
  → Stripe.js confirmSetup()
  → paymentMethodId (+ customerId) passed to reservation POST
```

### Reservation guarantee payload

Stored on the reservation document when guarantee fields are present:

```typescript
guarantee: {
  paymentMethodId: string
  customerId?: string | null
  status: 'vaulted'
}
```

### Admin charge no-show

From `BookingDetailDrawer`, when status is `no-show` and guarantee exists:

```
POST adminChargeNoShowUrl()  →  { reservationId }
```

Penalty amount: `cancellationFeePercent` (default 50) of the booked service price. Logic in `lib/no-show-penalty.ts` / `azure-functions/src/lib/noShowPenalty.ts`.

Tenant `bookingSettings` for charge logic are stored in Cosmos as `{clientId}-settings` (seed via `scripts/seed-tenant-booking-settings.mjs`).

---

## Data Model

Types live in [`types/admin.ts`](types/admin.ts) and [`types/cms.ts`](types/cms.ts).

### `AdminBookingService`

```typescript
{
  id: string
  name: string
  description: string
  durationMinutes: number   // 1–1440
  price: number             // >= 0
  currency: string          // e.g. "€"
  category?: string
  variations?: ServiceVariation[]
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
  guarantee?: ReservationGuarantee | null
}
```

Public widget submissions via Azure Functions are created with `status: 'pending'`. Local dev fallback uses `status: 'confirmed'`.

### `BookingScheduleFile`

```typescript
{
  weekly: WeeklyHoursRow[]     // exactly 7 rows, mon–sun
  exceptions: ScheduleException[]
}
```

**Resolution order** for a calendar date (`lib/booking-schedule-window.ts`):

1. Date exception with `closed: true` → closed all day.
2. Date exception with custom `from`/`to` → that window.
3. Else weekly row for weekday → if `open`, use `from`/`to`; else closed.

Default weekly template when file missing: Mon–Sat 09:00–21:00, Sun closed.

### Stripe Connect storage

Connected account ID stored in Cosmos `client-profile` container as document `{clientId}-stripe`:

```typescript
{ id: string, clientId: string, stripeAccountId: string | null }
```

---

## Persistence

### Local dev (`data/`)

Per-deployment JSON files (not committed per client in Git):

| File | Writer | Reader |
|------|--------|--------|
| `data/booking-services-local.json` | `PUT /api/admin/services` | Admin + `GET /api/booking-services` |
| `data/booking-schedule-local.json` | `PUT/POST/DELETE /api/admin/schedule` | Admin + `GET /api/availability` |
| `data/reservations-local.json` | `POST /api/reservation`, admin reservation routes | Admin + `GET /api/availability` |
| `data/stripe-connect-local.json` | `POST /api/admin/stripe-connect` | Admin stripe status |
| `data/company-profile-local.json` | `PUT /api/admin/company-profile` | Admin + SSG profile reads |

### Production (Azure Cosmos DB)

**Single database:** `web-builder-admin` (env: `COSMOS_ADMIN_DATABASE`), partition key `/clientId` on all containers.

| Container | Document id pattern | Purpose |
|-----------|---------------------|---------|
| `reservations` | `{clientId}-{timestamp}-…` | All booking records (public widget + admin) |
| `services` | `{clientId}-services` | Service catalog |
| `schedule` | `{clientId}-schedule` | Weekly hours + exceptions |
| `client-profile` | `{clientId}-profile`, `{clientId}-stripe` | Company profile + Stripe account id |
| `admin-users` | per user | Admin credentials + shell config |

Public booking Functions (`GET /availability`, `POST /reservations`, `GET /booking-services`) and admin Functions read/write the **same** `reservations` container via `getReservationsContainer()` in `azure-functions/src/cosmos/adminDb.ts`.

> **Note:** `COSMOS_DATABASE` / `COSMOS_CONTAINER` (defaults `reservations` / `bookings`) in `cosmosClient.ts` are legacy and unused by current Functions code. Do not create a separate public bookings database.

Access layer (local dev):

| Module | Path constant |
|--------|----------------|
| `lib/booking-services-db.ts` | `booking-services-local.json` |
| `lib/booking-schedule-db.ts` | `booking-schedule-local.json` |
| `lib/reservations-db.ts` | `reservations-local.json` |
| `lib/stripe-connect-db.ts` | `stripe-connect-local.json` |
| `lib/company-profile-db.ts` | `company-profile-local.json` |

---

## HTTP API Reference

### Public — local Route Handlers (dev only)

| Method | Route | Query / body | Response |
|--------|-------|--------------|----------|
| GET | `/api/booking-services` | `?clientId=` optional | `{ services }` |
| GET | `/api/availability` | `clientId`, `date`, `duration?` | `{ bookedSlots, outOfWindowSlots }` |
| GET | `/api/setup-intent` | `clientId`, `email` | `SetupIntentResponse` |
| POST | `/api/reservation` | Reservation payload | `{ ok: true }` or upstream error |

`POST /api/reservation`: if `client.json` → `reservationEndpoint` is set, forwards `{ clientId, ...body }` to that URL; otherwise appends to local JSON.

### Public — Azure Functions (production)

Base URL: `NEXT_PUBLIC_BOOKING_API_URL` (e.g. `https://<app>.azurewebsites.net/api`).

| Method | Route | Query / body | Response |
|--------|-------|--------------|----------|
| GET | `/booking-services` | `?clientId=` | `{ services }` |
| GET | `/availability` | `clientId`, `date`, `duration?` | `{ bookedSlots }` |
| GET | `/setup-intent` | `clientId`, `email` | `SetupIntentResponse` |
| POST | `/reservations` | `{ clientId, serviceId, durationMinutes, name, email, phone, date, time, notes?, paymentMethodId?, customerId? }` | `{ ok: true, reservationId }` |

CORS: Functions reflect the request `Origin` header. No auth required for public booking endpoints.

**Important:** `POST /reservations` normally triggers an OPTIONS preflight when sent with `Content-Type: application/json`. Azure Portal CORS allow-lists typically only cover admin/dev origins. The production widget therefore posts with `Content-Type: text/plain;charset=UTF-8` (JSON body) via `reservationPostHeaders()` to skip preflight — the Function still parses JSON from the body. Admin cross-origin calls still need Portal CORS (Bearer/cookie) configured for the admin SPA origin.

### Admin — local Route Handlers (dev)

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/admin/auth/me` | Session bootstrap |
| POST | `/api/admin/auth/login` | Issue session cookie |
| POST | `/api/admin/auth/logout` | Clear cookie |
| GET | `/api/admin/client-config` | `{ displayName, logoUrl }` |
| GET/PUT | `/api/admin/services` | Service catalog |
| GET/PUT/POST/DELETE | `/api/admin/schedule` | Weekly hours + exceptions |
| GET/POST | `/api/admin/reservations` | List / create |
| PATCH | `/api/admin/reservations/[id]` | Cancel / no-show |
| GET/PUT | `/api/admin/company-profile` | Company profile |
| GET/POST | `/api/admin/stripe-connect` | Stripe Connect (mock when no key) |
| POST | `/api/admin/charge-noshow` | Charge no-show fee |
| GET | `/api/admin/booking-settings` | Tenant booking settings |

### Admin — Azure Functions (production)

See [`azure-functions/README.md`](azure-functions/README.md). Admin data routes use the `/mgmt/` prefix:

| Method | Route | Purpose |
|--------|-------|---------|
| GET/POST/PATCH | `/mgmt/reservations` | List / create / update |
| GET/PUT | `/mgmt/services` | Service catalog |
| GET/PUT/POST/DELETE | `/mgmt/schedule` | Schedule |
| GET/PUT | `/mgmt/company-profile` | Company profile |
| GET/POST | `/mgmt/stripe-connect` | Stripe Connect onboarding |
| GET | `/mgmt/booking-settings` | Tenant `bookingSettings` |
| POST | `/mgmt/charge-noshow` | Charge no-show fee |
| GET | `/clients/{clientId}/config` | Shell header config |

Auth routes (no `/mgmt` prefix): `/auth/login`, `/auth/logout`, `/auth/me`.

---

## Availability & Conflict Logic

Shared slot grid: `BOOKING_SLOT_GRID` in `lib/booking-slot-grid.ts`.

For each slot start time `S` and requested duration `D`:

1. **`outOfWindowSlots`** (local only today) — `!slotFitsScheduleWindow(schedule, date, minutes(S), D)`.
2. **`bookedSlots`** — overlaps any non-cancelled, non-no-show reservation for same `clientId` + `date` (interval overlap on minute timeline; legacy rows without `durationMinutes` use 60 minutes).

Admin calendar timeline uses `resolveDayMinutesWindow` for vertical scale (pixels per minute ≈ 1.15 in `AdminBookingsPage`).

---

## Environment Variables

### Public static site (blob build)

| Variable | Source | Purpose |
|----------|--------|---------|
| `CLIENT_ID` | Build input | Tenant id baked into pages |
| `NEXT_PUBLIC_CLIENT_ID` | Build | Same, for client-side `resolveBuildClientId()` |
| `NEXT_PUBLIC_BOOKING_API_URL` | Repo var `ADMIN_API_URL` | Azure Functions base URL for widget API calls |
| `NEXT_PUBLIC_BOOKING_SERVICES_ENDPOINT` | Optional, from `client.json` | Override services catalog URL |
| `COMPANY_PROFILE_BUILD_TOKEN` | GitHub secret | Build-time company profile fetch |

### Admin SPA build

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_ADMIN_API_URL` | Azure Functions base URL — switches all admin fetches to remote |

### Local dev

| Variable | Purpose |
|----------|---------|
| `CLIENT_ID` | Tenant for public APIs and local admin session |
| `ADMIN_JWT_SECRET` | JWT signing (min 32 chars) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Local admin login |
| `STRIPE_SECRET_KEY` | Optional — real Stripe locally; mock when unset |

### Azure Function App

| Variable | Purpose |
|----------|---------|
| `COSMOS_ENDPOINT`, `COSMOS_KEY` | Cosmos DB |
| `COSMOS_ADMIN_DATABASE` | Default `web-builder-admin` |
| `ADMIN_JWT_SECRET` | Admin JWT validation |
| `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY` | Connect + SetupIntent |
| `ADMIN_STRIPE_RETURN_URL` | Stripe onboarding return URL |
| `SENDGRID_API_KEY`, `NOTIFICATION_EMAIL_FROM` | Confirmation emails |
| `COMPANY_PROFILE_BUILD_TOKEN` | Build-time profile reads |

---

## File Map (for agents)

When changing bookings, start from the route or API you touch:

```
app/admin/                          # routes (all "use client")
  (dashboard)/settings/page.tsx     # company profile + Stripe Connect

app/api/
  booking-services/route.ts         # public (dev)
  availability/route.ts             # public (dev)
  reservation/route.ts              # public (dev) — proxies to reservationEndpoint
  setup-intent/route.ts             # public (dev)
  admin/
    stripe-connect/route.ts
    charge-noshow/route.ts
    booking-settings/route.ts
    company-profile/route.ts
    ... (services, schedule, reservations)

azure-functions/src/
  functions/
    getAvailability.ts              # GET /availability → admin reservations container
    createReservation.ts            # POST /reservations
    getBookingServices.ts           # GET /booking-services
    setupIntent.ts                  # GET /setup-intent
    admin/
      stripeConnect.ts              # GET/POST /mgmt/stripe-connect
      chargeNoShow.ts               # POST /mgmt/charge-noshow
      bookingSettings.ts            # GET /mgmt/booking-settings
      companyProfile.ts
      reservations.ts, services.ts, schedule.ts
  cosmos/adminDb.ts                 # getReservationsContainer(), etc.
  lib/stripeConnect.ts              # Standard Connect account creation

components/
  blocks/
    ReservationBlock.tsx            # uses lib/booking-api.ts URL helpers
    ReservationCardCapture.tsx      # SetupIntent + Stripe.js
    ReservationProgress.tsx
  admin/
    AdminStripeConnectSection.tsx
    AdminCompanyProfileForm.tsx
    bookings/BookingDetailDrawer.tsx  # charge no-show

lib/
  booking-api.ts                    # public URL helpers (dual-mode)
  booking-guarantee.ts
  booking-public-copy.ts
  no-show-penalty.ts
  reservation-guarantee.ts
  setup-intent.ts                   # local dev mock
  stripe-connect.ts                 # local dev mock
  admin-api.ts                      # admin URL helpers (dual-mode)

types/booking.ts                    # SetupIntentResponse
types/cms.ts                        # BookingSettings, ReservationBlock
types/admin.ts                      # StoredReservation, ReservationGuarantee
```

Tests are colocated under `__tests__/` mirroring the above paths.

---

## Agent Conventions

- Read [`architecture.md`](architecture.md) for tenant config, theming, and block registry rules.
- Admin UI: all components are `"use client"`. Never add server-side data fetching to `app/admin/` pages.
- All admin data fetches must go through `adminFetch()` from `lib/admin-api.ts`.
- All public booking fetches from components must use `lib/booking-api.ts` helpers — never hardcode `/api/reservation` or `/api/availability` in client components.
- `clientId` in admin components must always come from `useAdminAuth().session.clientId` — never from `process.env.CLIENT_ID`.
- Public widget `clientId` comes from block prop or `NEXT_PUBLIC_CLIENT_ID` / `CLIENT_ID` at build via `resolveBuildClientId()`.
- Stripe Connect: use Standard accounts (`stripe_dashboard.type = 'full'`). Express (`express`) requires the platform to collect fees and accept liability — not suitable for this product.
- After substantive TS changes: `npm run validate` (lint + test + tsc).
- Service catalog changes affect both admin and public widget — keep schema fields aligned.

---

## Related Docs

| Doc | Topic |
|-----|--------|
| [`architecture.md`](architecture.md) | Multi-tenant SSG, `ClientConfig`, runtime APIs summary |
| [`azure-functions/README.md`](azure-functions/README.md) | Function App endpoints, Cosmos setup, env vars |
| [`docs/blocks.md`](docs/blocks.md) | Block registry and page JSON |
| [`business/tasks/22-stripe-no-show.md`](business/tasks/22-stripe-no-show.md) | No-show guarantee task spec |
