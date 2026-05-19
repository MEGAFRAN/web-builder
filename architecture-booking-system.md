# Bookings Architecture

Feature-level architecture for reservations: the public booking widget, admin portal, Route Handlers, and local (or upstream) persistence. For platform-wide build flow, client config, and blocks, see [`architecture.md`](architecture.md).

---

## Goal

Each tenant deployment (`CLIENT_ID`) exposes:

1. **Public booking** — a multi-step `reservationBlock` on CMS pages where visitors pick a service, date/time, and contact details.
2. **Admin operations** — authenticated routes under `/admin` to manage the service catalog, weekly/date-specific availability, and the appointment calendar.

All booking state for a deployment is scoped to that deployment’s `CLIENT_ID`. There is no runtime tenant switching within a single build.

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│  CMS page (SSG)                                                          │
│  reservationBlock ──fetch──► GET /api/booking-services (catalog)         │
│              │              GET /api/availability (slots)                │
│              └─POST────────► POST /api/reservation                       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    reservationEndpoint set? ──yes──► Azure Function (Cosmos)
                                    │
                                   no
                                    ▼
                         data/reservations-local.json

┌─────────────────────────────────────────────────────────────────────────┐
│  Admin portal (/admin/*)  ◄── proxy.ts (session cookie + CLIENT_ID)     │
│    bookings │ services │ availability │ settings                       │
│         │         │            │                                         │
│         ▼         ▼            ▼                                         │
│  /api/admin/reservations  /api/admin/services  /api/admin/schedule       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
              data/booking-services-local.json
              data/booking-schedule-local.json
              data/reservations-local.json
```

**Production note:** `next.config.ts` sets `output: 'export'` outside development, so static HTML is emitted to `/out`. Route Handlers and the admin UI require a **Node-hosted** Next server (e.g. `npm run dev`, `next start`, or a host that runs the app with env vars). For pure static SWA deploys, wire `reservationEndpoint` / `availabilityEndpoint` to external backends — see [`azure-functions/README.md`](azure-functions/README.md).

---

## Admin Routes (`app/admin`)

Thin App Router pages delegate to client components. Layout supplies branding from build-time client config.

```
app/admin/
  layout.tsx                    # pass-through (no chrome)
  login/
    page.tsx                    # AdminLoginForm (public)
  (dashboard)/
    layout.tsx                  # AdminShell + getClientConfig(CLIENT_ID)
    page.tsx                    # redirect → /admin/bookings
    bookings/page.tsx           # AdminBookingsPage
    services/page.tsx           # AdminServicesPage
    availability/page.tsx       # AdminAvailabilityPage
    settings/page.tsx           # placeholder copy (admin-copy)
```

| Route | Page component | Purpose |
|-------|----------------|---------|
| `/admin` | redirect | Lands on `/admin/bookings` |
| `/admin/login` | `AdminLoginForm` | Email/password login; `?error=misconfigured` when env missing |
| `/admin/bookings` | `AdminBookingsPage` | Day/week calendar, detail drawer, manual appointments |
| `/admin/services` | `AdminServicesPage` | CRUD + drag reorder of bookable services |
| `/admin/availability` | `AdminAvailabilityPage` | Weekly hours + per-date exceptions |
| `/admin/settings` | static section | Reserved; no API yet |

### Shell & navigation

`AdminShell` (`components/admin/AdminShell.tsx`) is a client layout with:

- Sidebar (desktop) and bottom tab bar + drawer (mobile)
- Nav items: Bookings, Services, Availability, Settings
- Sign-out → `POST /api/admin/auth/logout` → `/admin/login`
- Full-width main container on **bookings** and **availability** routes

Dashboard layout reads `getClientConfig(CLIENT_ID)` for `displayName` and optional `header.logo`.

### Bookings UI composition

`AdminBookingsPage` orchestrates subcomponents under `components/admin/bookings/`:

| Component | Role |
|-----------|------|
| `CalendarNavBar` | Date picker, day/week toggle |
| `DayTimeline` | Time-positioned cards for one day (uses schedule window) |
| `WeekGrid` | Seven-day summary; click day → day view |
| `SimpleDayList` | Fallback list when day is “closed” in schedule but reservations exist |
| `CalendarEmptyState` | Empty or closed-day CTA |
| `BookingDetailDrawer` | View booking; cancel / no-show actions |
| `NewAppointmentModal` | Manual booking via admin API + availability slots |

Shared helpers: `lib/booking-utils.ts` (dates), `lib/booking-schedule-window.ts` (open/close minutes per day).

---

## Authentication

### Edge gate: `proxy.ts`

Next.js 16 **proxy** (formerly middleware) protects:

- Pages: `/admin`, `/admin/bookings`, `/admin/services`, `/admin/availability`, `/admin/settings`
- APIs: `/api/admin/*` except `/api/admin/auth/*`

Unauthenticated browser requests redirect to `/admin/login?redirect=…`. API requests return `401`. Missing `ADMIN_SESSION_SECRET` or `CLIENT_ID` redirects with `?error=misconfigured`.

Session verification uses Web Crypto HMAC (Edge-compatible). Payload must match `process.env.CLIENT_ID`.

### Login & session

| Item | Detail |
|------|--------|
| Login | `POST /api/admin/auth/login` — body `{ email, password }` |
| Env | `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `CLIENT_ID` |
| Cookie | `bp_admin_session` (`ADMIN_SESSION_COOKIE`), httpOnly, 7-day maxAge |
| Token | `base64url(JSON).hex_hmac_sha256` — see `lib/admin-session.ts` |
| Payload | `{ email, clientId, exp }` — **clientId must equal `CLIENT_ID`** |
| API guard | `requireAdminSession()` in each `/api/admin/*` route handler |

Logout: `POST /api/admin/auth/logout` clears the cookie.

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

Per-deployment / per-clone JSON files (not committed per client in Git — environment-specific):

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

Shape for services file: `{ "services": AdminBookingService[] }`. Reservations file: **array** of `StoredReservation`. Schedule file: `BookingScheduleFile`.

---

## HTTP API Reference

### Public (unauthenticated)

| Method | Route | Query / body | Response |
|--------|-------|--------------|----------|
| GET | `/api/booking-services` | `?clientId=` optional | `{ services }` — 404 empty if clientId mismatch |
| GET | `/api/availability` | `clientId`, `date`, `duration?` (default 60) | `{ bookedSlots, outOfWindowSlots }` |
| POST | `/api/reservation` | Reservation payload | `{ ok: true }` or upstream error |

`POST /api/reservation`: if `client.json` → `reservationEndpoint` is set, forwards `{ clientId, ...body }` to that URL; otherwise appends to local JSON with `status: 'confirmed'`.

### Admin (session required)

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/admin/services` | List catalog |
| PUT | `/api/admin/services` | Replace entire `{ services }` array |
| GET | `/api/admin/schedule` | Full schedule file |
| PUT | `/api/admin/schedule` | Replace `weekly` (7 rows, mon–sun) |
| POST | `/api/admin/schedule` | Add/replace date exception |
| DELETE | `/api/admin/schedule?id=` | Remove exception by id |
| GET | `/api/admin/reservations` | `startDate`, `endDate` (YYYY-MM-DD) → enriched list |
| POST | `/api/admin/reservations` | Manual booking (`status: confirmed`) |
| PATCH | `/api/admin/reservations/[id]` | `{ action: 'cancel' \| 'no-show', reason? }` |
| POST | `/api/admin/auth/login` | Issue session cookie |
| POST | `/api/admin/auth/logout` | Clear cookie |

Admin reservation GET filters by `CLIENT_ID` and date range, sorts by date then time, joins `serviceName` from catalog.

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
| `CLIENT_ID` | Build, all booking APIs, session binding | Every deployment |
| `ADMIN_SESSION_SECRET` | Login, proxy, `requireAdminSession` | Admin portal |
| `ADMIN_EMAIL` | Login | Admin portal |
| `ADMIN_PASSWORD` | Login | Admin portal |

Optional upstream (Function App — not in static site repo): `COSMOS_*`, `SENDGRID_API_KEY` — see [`azure-functions/README.md`](azure-functions/README.md).

Local dev example:

```bash
npm run dev restaurante-pepe
# sets CLIENT_ID=restaurante-pepe via scripts/run-next-dev.mjs
```

---

## File Map (for agents)

When changing bookings, start from the route or API you touch:

```
app/admin/                          # routes (thin)
app/api/
  booking-services/route.ts
  availability/route.ts
  reservation/route.ts
  admin/
    auth/login|logout/route.ts
    services/route.ts
    schedule/route.ts
    reservations/route.ts
    reservations/[id]/route.ts
components/
  blocks/ReservationBlock.tsx
  admin/
    AdminShell.tsx
    AdminBookingsPage.tsx
    AdminServicesPage.tsx
    AdminAvailabilityPage.tsx
    AdminLoginForm.tsx
    admin-copy.ts
    bookings/                       # calendar UI pieces
lib/
  booking-services-db.ts
  booking-schedule-db.ts
  booking-schedule-utils.ts
  booking-schedule-window.ts
  booking-slot-grid.ts
  booking-utils.ts
  reservations-db.ts
  admin-session.ts
  require-admin.ts
types/admin.ts
proxy.ts                            # admin auth gate (Next 16)
data/*.json                         # local persistence (dev)
config/schemas/blocks/reservationBlock.schema.json
```

Tests are colocated under `__tests__/` mirroring the above paths.

---

## Agent Conventions

- Read [`architecture.md`](architecture.md) for tenant config, theming, and block registry rules.
- Admin UI: Tailwind + existing layout/content components; copy in `components/admin/admin-copy.ts` (Spanish strings).
- Do not add npm packages without explicit instruction.
- After substantive TS changes: `npx tsc --noEmit` and `npm run test`.
- Service catalog changes affect both admin and public widget — keep `AdminBookingService` and `reservationBlock` schema fields aligned.
- Persisted JSON is per deployment; never assume cross-client sharing in `data/`.

---

## Related Docs

| Doc | Topic |
|-----|--------|
| [`architecture.md`](architecture.md) | Multi-tenant SSG, `ClientConfig`, runtime APIs summary |
| [`docs/blocks.md`](docs/blocks.md) | Block registry and page JSON |
| [`azure-functions/README.md`](azure-functions/README.md) | Production Cosmos + email |
