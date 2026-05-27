# Web Builder Platform — Project Summary

**Purpose:** This document gives any LLM a high-level understanding of the web-builder platform: what it is, how it is architected, and what it ships today. It is derived from the platform feature reference and intentionally excludes task progress or roadmap status.

---

## What This Project Is

A **Next.js-based, multi-tenant Static Site Generation (SSG) and serverless platform** that builds, deploys, and manages isolated public websites plus a unified admin dashboard for **100+ clients from a single codebase**.

The platform is designed to be **managed by AI agents**. Architectural and implementation decisions prioritize agent readability, schema enforcement, and predictable build pipelines.

---

## High-Level Architecture

```
                                  ┌─────────────────────────────┐
                                  │    Single Shared Codebase   │
                                  └──────────────┬──────────────┘
                                                 │
                        ┌────────────────────────┴────────────────────────┐
                        ▼                                                 ▼
        ┌───────────────────────────────┐                 ┌───────────────────────────────┐
        │      Public Client Sites      │                 │      Unified Admin Portal     │
        ├───────────────────────────────┤                 ├───────────────────────────────┤
        │ - Fully Static (SSG)          │                 │ - Single Client-Side SPA      │
        │ - Compiled per Client         │                 │ - Multi-Tenant (via JWT)      │
        │ - Hosted on Azure Blob ($web) │                 │ - Hosted on Azure SWA         │
        └──────────────┬────────────────┘                 └──────────────┬────────────────┘
                       │                                                 │
                       └────────────────────────┬────────────────────────┘
                                                ▼
                               ┌─────────────────────────────────┐
                               │   Serverless API Gateway        │
                               │   - Azure Functions             │
                               │   - Cosmos DB Persistence       │
                               └─────────────────────────────────┘
```

**Core design pattern:** **Build-time tenant isolation** for public sites, combined with a **single shared SPA** for admin. Public sites are compiled per client with no runtime tenant lookup. The admin app is one deployment that serves all tenants via JWT-based session scoping.

---

## Business Model & Value

### Cost & Operations
- **Single codebase, many clients:** Public sites compile to static HTML/CSS/JS. Adding clients mainly adds cheap Azure Blob Storage, not new servers.
- **Automated deployments:** Site structure, themes, and content are declared in JSON. CI/CD propagates codebase updates across clients.
- **Single admin surface:** One admin SPA serves every tenant; workspace complexity does not scale linearly with client count.

### Client Onboarding & Monetization
- **No-code provisioning:** New sites launch by defining a `client.json`. Industry templates (restaurant, portfolio, landing page, etc.) provide layouts, navigation, footers, and pages out of the box.
- **Lead and booking drivers:** Contact forms and a multi-step **Booking & Scheduling Widget** (`reservationBlock`) convert visitors into bookings.
- **Per-tenant branding:** Colors, fonts, spacing, rounded corners, and custom domains override templates without code changes.

---

## Engineering Architecture

### Build-Time Tenant Isolation
- **`CLIENT_ID` is the build gate:** At build time, only the JSON config for the active client is loaded.
- **Twin-export pipeline:** Custom prep scripts restructure the app before `next build`, excluding routes that must not appear in each export target.

| Command Target | Prep Script | Excluded Routes | Output | Deploy Target |
|---|---|---|---|---|
| `npm run build:blob` | `scripts/prepare-static-export.mjs` | `app/api/`, `app/admin/` | `/out` (trailing slashes) | Azure Blob Storage (`$web`) |
| `npm run build:admin` | `scripts/prepare-admin-export.mjs` | `app/api/`, `app/(site)/` | `/out` | Azure Static Web Apps (`$web-admin`) |
| `npm run dev` | `scripts/run-next-dev.mjs` | None (full app) | Local Next.js dev server | Developer machine |

### Dual-Mode API Gateway
- **Local dev:** When `NEXT_PUBLIC_ADMIN_API_URL` is unset, the app uses Next.js Route Handlers (`app/api/`) and local JSON files under `data/` (`reservations-local.json`, `booking-services-local.json`, `booking-schedule-local.json`). No cloud dependency required.
- **Production:** When `NEXT_PUBLIC_ADMIN_API_URL` is set, the admin SPA and public widgets call **Azure Functions** backed by **Azure Cosmos DB** multi-tenant containers.

### JSON Schema Validation
- Schemas live under `config/schemas/`.
- Client configs, template presets, and block schemas (e.g. `heroBlock.schema.json`, `statsBlock.schema.json`, `reservationBlock.schema.json`) use `"additionalProperties": false`.
- Invalid config is rejected at build time.

### Build-Time Theme Engine
- Themes compile to CSS variables injected into `<style>:root` at layout assembly.
- Tailwind uses semantic classes (`btn-primary`, `text-brand`, etc.).
- No runtime CSS-in-JS or theme JavaScript.

---

## Product: Block System & UX

### Modular Page Composition
Pages are ordered lists of blocks from the central **Component Registry** (`components/componentRegistry.ts`). The platform ships **27 core blocks**, dynamically code-split via `next/dynamic`.

**Categories:**

| Category | Blocks |
|---|---|
| Structural & Nav | `navbar`, `footer`, `breadcrumb`, `divider` |
| Marketing | `hero`, `heroBlock`, `ctaBlock`, `logoCloud`, `featureGridBlock`, `testimonialsBlock`, `caseStudiesBlock`, `blog_list`, `statsBlock`, `faqBlock`, `carouselBlock`, `missionBlock`, `valuesBlock`, `teamBlock`, `location`, `services` |
| Engagement & Forms | `contact`, `contactInfoBlock`, `contactFormSection`, `reservationBlock` |
| Full-Page Specialty | `servicesPageBlock`, `pricingPageBlock`, `testimonialsPageBlock`, `caseStudyDetailBlock` |

### Guest Booking Widget (`reservationBlock`)
Four-step public booking flow:
1. **Service selection** — catalog with prices and durations
2. **Date & time picker** — real-time slot availability with conflict and hours validation
3. **Contact capture** — name, email, phone, optional notes
4. **Confirmation** — immediate booking status feedback

### Admin UX Principles
- **Mobile-first:** Responsive grids, bottom nav on mobile, drawers, sticky actions.
- **Lightweight calendars:** Timeline views scale pixels to minutes without heavy third-party calendar libraries.
- **Accessibility baseline (WCAG 2.2 AA):** Semantic HTML, contrast ratios (4.5:1 text, 3:1 large/boundaries), keyboard navigation with `focus-visible`, ARIA labels on interactive states.

---

## Public Site Block Catalog

| Block | Purpose |
|---|---|
| `navbar` | Sticky header with logo, CTA, dynamic links |
| `footer` | Multi-column footer with social, newsletter, copyright |
| `breadcrumb` | Page hierarchy trail |
| `divider` | Visual spacing separator |
| `hero` | Centered above-the-fold banner with CTA |
| `heroBlock` | Multi-column hero with image and dual CTAs |
| `ctaBlock` | Full-width conversion block |
| `logoCloud` | Partner/trust logo grid |
| `services` | Service catalog teasers |
| `featureGridBlock` | Feature/benefit grid |
| `testimonialsBlock` | Review slider or grid |
| `caseStudiesBlock` | Portfolio/success story grid |
| `blog_list` | Paginated blog listing |
| `statsBlock` | Numeric metrics display |
| `faqBlock` | Accordion FAQ |
| `carouselBlock` | Swipable featured content |
| `missionBlock` | Vision/quote block |
| `valuesBlock` | Core values card grid |
| `teamBlock` | Team member profiles |
| `location` | Map, address, hours |
| `contact` | Contact info + messaging form |
| `contactInfoBlock` | Address, phone, email side-by-side |
| `contactFormSection` | Full-width lead form |
| `servicesPageBlock` | Detailed services page layout |
| `pricingPageBlock` | Pricing cards with term toggles |
| `testimonialsPageBlock` | Searchable/sortable reviews page |
| `caseStudyDetailBlock` | In-depth case study layout |
| `reservationBlock` | End-to-end booking widget |

---

## Public HTTP APIs

In production, browsers call Azure Functions directly. Locally, equivalent Next.js Route Handlers exist under `app/api/`.

| Route | Method | Input | Response | Purpose |
|---|---|---|---|---|
| `/api/booking-services` | GET | Optional `?clientId` | `{ services: AdminBookingService[] }` | Bookable service catalog |
| `/api/availability` | GET | `clientId`, `date`, `duration` | `{ bookedSlots: string[], outOfWindowSlots: string[] }` | Available time slots |
| `/api/reservation` | POST | Booking JSON body | `{ ok: true, reservationId: string }` | Create confirmed booking |
| `/api/contact` | POST | Contact JSON body | `{ ok: true }` | Submit general inquiry |

---

## Admin Portal

The admin surface lives under `app/admin/` and compiles into a **single shared Static Web App** deployment.

### Auth & Security
- **`AdminAuthContext`** (`lib/admin-auth-context.tsx`): Session state in `sessionStorage`; validates on reload via `/auth/me`.
- **JWT cookies:** HS256 tokens (`jose`) in `httpOnly` cookie `admin-session`, signed with `ADMIN_JWT_SECRET` (min 32 chars).
- **Route protection:** Client-side guards redirect unauthenticated users to `/admin/login`. Local dev also uses Edge Middleware (`proxy.ts`) for JWT verification on protected routes and APIs.

### Admin Route Map

```
app/admin/
├── layout.tsx                    # AdminAuthProvider wrapper
├── login/page.tsx                # Credentials + Client ID login
└── (dashboard)/
    ├── layout.tsx                # Session guard + AdminShell
    ├── page.tsx                  # Redirects to bookings
    ├── bookings/page.tsx         # Timeline & calendar views
    ├── services/page.tsx         # Service catalog CRUD
    ├── availability/page.tsx     # Weekly schedule & exceptions
    └── settings/page.tsx         # Settings (placeholder)
```

### Admin Features
1. **Bookings (`/admin/bookings`):** Day timeline and week grid views, detail inspector panel, cancel/no-show actions, manual booking with conflict checking.
2. **Services (`/admin/services`):** CRUD for services with price, currency, duration (minutes), drag-and-drop display order.
3. **Availability (`/admin/availability`):** Weekly hour editor and one-off date exceptions (holidays, closures, extended hours).

---

## Key Conventions for Agents

- **Tenant config:** JSON files per client; validated against schemas in `config/schemas/`.
- **Block registration:** Add or modify blocks in `components/componentRegistry.ts` with matching schema files.
- **Build targets:** Always use the correct npm script (`build:blob` vs `build:admin`) — each excludes different route trees.
- **Local vs prod API:** Controlled by presence of `NEXT_PUBLIC_ADMIN_API_URL` and `CLIENT_ID` at build/runtime.
- **No cross-tenant leakage:** Public builds must never include admin routes or API handlers; admin builds must never include public site routes.

---

## Related Documents

- **Feature inventory (detailed):** `business/tasks/project-features-reference.md`
- **Task tracking:** `business/tasks/progress.md` and individual task files under `business/tasks/`
