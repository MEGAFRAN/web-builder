# Platform Architecture & Feature Reference Summary

**Target Audience:** Chief Executive Officer (CEO), Chief Technology Officer (CTO), Chief Product Officer (CPO)  
**Date:** May 23, 2026  
**Document Status:** Authority Reference & Project Inventory  

---

## 1. Executive Summary

This platform is a Next.js-based, multi-tenant Static Site Generation (SSG) and serverless engine designed to build, deploy, and manage isolated public sites and an integrated admin dashboard for over 100+ clients from a single, unified codebase. 

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

The core innovation lies in **Build-Time Tenant Isolation** for public-facing client sites combined with a **Single Shared Single Page Application (SPA)** for the administrative dashboard. This dual-deployment model unlocks unprecedented cost-efficiency, absolute security against cross-tenant data leaks at the static edge, and zero-touch client onboarding.

---

## 2. CEO Reference: Business Value & Scalability

### 2.1 Hyper-Efficient Multi-Tenancy (Cost & Operations)
* **Single Codebase, 100+ Clients:** Traditional SaaS models require running independent web servers or database instances per client. Our architecture compiles static HTML/CSS/JS assets. Spawning 100 clients costs virtually the same as spawning one, requiring only cheap Azure Blob Storage container hosting.
* **Instant, Zero-Maintenance Deployments:** Site features, theme colors, and structure are completely declared in a lightweight JSON configuration. Updates to the core codebase are propagated to all clients via automated CI/CD pipelines without manual intervention.
* **Single Admin Overhead:** Instead of maintaining individual admin panels per tenant, a single Admin SPA deployment serves every client on the platform. The workspace dynamically scales without multiplying management surface area.

### 2.2 Commercialization & Client Onboarding
* **No-Code Client Provisioning:** New client websites can be launched in seconds by defining a `client.json` file. Through the Template System, a new client automatically inherits complete web layouts, navigation headers, footers, and page definitions from industry presets (e.g., standard restaurant, minimal portfolio, general landing page) with zero development time.
* **Transaction & Lead Drivers:** Sites are pre-equipped with functional contact forms and a high-converting, interactive Booking & Scheduling Widget designed to turn passive web visitors into paying customers.
* **Custom Branding & Styling:** Powerful, instant customizations are supported at the tenant level (colors, custom fonts, rounded corners, spacing parameters, custom domains) overriding templates on demand.

---

## 3. CTO Reference: Engineering Architecture & AX

### 3.1 Build-Time Tenant Isolation
To prevent runtime lookup delays, cross-tenant data leaks, or layout shift bugs, the platform enforces strict build isolation.
* **The `CLIENT_ID` Gate:** At build time, the `CLIENT_ID` environment variable is the absolute gate. The Next.js static build process loads only the specific JSON configuration file matching the active client.
* **Double-Build Pipeline (Twin-Export Targets):**
  We utilize custom preparation scripts (`scripts/prepare-static-export.mjs` and `prepare-admin-export.mjs`) to physically restructure folders and exclude unnecessary routes prior to calling `next build`, ensuring no server-side leak occurs in the statically exported code:
  
| Command Target | Executed Script | Active Exclusions (Moved Out of App) | Primary Output Destination | Deployed Environment |
|---|---|---|---|---|
| `npm run build:blob` | `prepare-static-export.mjs` | `app/api/`, `app/admin/` | `/out` (with trailing slashes) | Azure Blob Storage (`$web`) |
| `npm run build:admin` | `prepare-admin-export.mjs` | `app/api/`, `app/(site)/` | `/out` | Azure Static Web Apps (`$web-admin`) |
| `npm run dev` | `run-next-dev.mjs` | None (Mounts full environment) | Local next dev server | Local Workspace (zsh/developer machine) |

### 3.2 Dual-Mode API Gateway Architecture
The codebase maintains a strict boundary between local development speed and production scalability:
* **Local Development Mode:** Operates with zero cloud dependencies. When `NEXT_PUBLIC_ADMIN_API_URL` is omitted, the platform falls back to Next.js Local Route Handlers (`app/api/`) and reads/writes to lightweight local JSON files under `data/` (`reservations-local.json`, `booking-services-local.json`, `booking-schedule-local.json`). This ensures offline capability and instantaneous development loops.
* **Production Deployed Mode:** When `NEXT_PUBLIC_ADMIN_API_URL` is set, the unified Admin SPA dynamically routes all authentication and transaction requests directly to a serverless Azure Functions backend connected to multi-tenant Azure Cosmos DB containers.

### 3.3 Strict JSON Schema Validation
To maintain the integrity of automated adjustments (e.g., when AI agents or automation scripts write page changes), we enforce rigorous JSON Schemas under `config/schemas/`. 
* All client configs, base template presets, and individual component block schemas (e.g., `heroBlock.schema.json`, `statsBlock.schema.json`, `reservationBlock.schema.json`) forbid unknown properties (`"additionalProperties": false`) and validate type definitions at build time. The build pipeline immediately rejects any configuration change violating these schemas.

### 3.4 Build-Time Theme Engine
Themes compile to highly optimized CSS variables injected directly into `<style>:root` at layout assembly. Tailwind CSS utilizes these semantic classes (such as `btn-primary` or `text-brand`). There is zero runtime JavaScript overhead or CSS-in-JS style computation.

---

## 4. CPO Reference: Product UX, UI & Block System

### 4.1 Modular Layout & Content Engine (Block Canvas)
Pages are expressed as lists of self-contained blocks managed by the platform's central Component Registry (`components/componentRegistry.ts`). This structure provides absolute layout freedom. We support **27 core component blocks** out of the box, split into thematic categories:

```
                            PLATFORM BLOCK REGISTRY
                                  (27 Blocks)
                                       │
      ┌────────────────────────┬───────┴────────┬────────────────────────┐
      ▼                        ▼                ▼                        ▼
  Structural & Nav          Marketing       Engagement & Forms      Specialty & Pages
  - navbar                 - hero           - contact               - servicesPageBlock
  - footer                 - heroBlock      - contactInfoBlock      - pricingPageBlock
  - breadcrumb             - ctaBlock       - contactFormSection    - testimonialsPageBlock
  - divider                - statsBlock     - reservationBlock      - caseStudyDetailBlock
                           - logoCloud                              - carouselBlock
                           - featureGridBlock
                           - testimonialsBlock
                           - caseStudiesBlock
                           - blog_list
                           - missionBlock
                           - valuesBlock
                           - teamBlock
                           - faqBlock
                           - location
                           - services
```

* **Dynamic Code Splitting:** Every block utilizes `next/dynamic` static imports, ensuring that visitors only download the precise JavaScript payload required for the blocks rendered on the current page, preserving rapid mobile load times.

### 4.2 Comprehensive Booking & Scheduling Funnel
The primary transactional component is the **Guest Booking Widget (`reservationBlock`)**, which features a high-fidelity, frictionless 4-step guest flow:
1. **Service Selection:** Dynamic retrieval of available services, prices, and durations from the live catalog.
2. **Date & Time Picker:** Interactive slot selector querying active merchant schedules in real-time. It programmatically flags unavailable slots (already booked or outside standard hours) to prevent calendar overlap.
3. **Contact Details Capture:** Minimal input fields for Name, Email, Phone, and optional Booking Notes.
4. **Confirmation Display:** Instant visual feedback of booking status.

### 4.3 Mobile-First Admin Experience
The unified Admin Dashboard is designed for small business owners managing their operations on the go.
* **Fluid Layouts:** Uses responsive grid layers, transitioning from horizontal sidebars on desktop to responsive bottom navigation bars, full-screen drawers, and sticky action buttons on mobile screens.
* **No-Lag Calendars:** Timeline rendering scales pixels to minutes proportionally, providing lightweight calendar navigation without heavy third-party calendar packages.
* **Universal Accessibility (WCAG 2.2 AA Baseline):**
  * Semantic HTML tag structures (`<nav>`, `<main>`, `<section>`).
  * Strict contrast guidelines (minimum 4.5:1 ratio for standard text, 3:1 for large elements/boundaries).
  * 100% Keyboard-navigable widgets and forms with visible focus rings (`focus-visible`).
  * Native error messaging and screen-reader friendly states (`aria-*` labels).

---

## 5. Current Feature Registry & Implementation Inventory

The following is an inventory of the platform's components, APIs, and file-level configurations as of May 23, 2026.

### 5.1 Public Site Block Catalog

The platform currently ships with **27 registered page block components** mapped to JSON configuration types:

* **Basic Layout Blocks:**
  * `navbar`: Responsive, sticky-capable primary header with logo configuration, call-to-action button, and dynamic links.
  * `footer`: Structured footer columns supporting social icons, newsletter descriptors, and copyright variables.
  * `breadcrumb`: Standard text navigation trail for complex site page trees.
  * `divider`: Spacing separator to break visual blocks.
* **Hero & Branding Blocks:**
  * `hero`: Clean, centered above-the-fold banner with high-contrast text and a central button.
  * `heroBlock`: Modern multi-column homepage hero block optimized for large images and dual CTAs.
  * `ctaBlock`: Full-width call-to-action block designed to drive immediate conversions.
  * `logoCloud`: Grid section to highlight affiliated partners, brand logos, or trust seals.
* **Content & Showcase Blocks:**
  * `services`: Standard block showing service catalog teasers with icons, headlines, and descriptions.
  * `featureGridBlock`: Grid alignment displaying feature checkmarks, statistics, or benefit details.
  * `testimonialsBlock`: Elegant slider or grid of customer reviews with avatars and ratings.
  * `caseStudiesBlock`: Grid of project case studies, client success stories, or portfolio pieces.
  * `blog_list`: Dynamic, paginated list of blog articles with thumbnail grids and read-time metadata.
  * `statsBlock`: Visual numeric counts displaying high-impact business metrics.
  * `faqBlock`: Accessible accordion dropdown cards answering common customer inquiries.
  * `carouselBlock`: Swipable horizontal carousel showing featured banners or custom assets.
* **Identity & Location Blocks:**
  * `missionBlock`: Focused vertical block emphasizing business vision statements or quotes.
  * `valuesBlock`: Multi-card grid highlighting core corporate or service philosophies.
  * `teamBlock`: Profiles grid showcasing employee photos, titles, and social bios.
  * `location`: Embedded interactive maps, address cards, transport details, and business hours.
  * `contact`: Comprehensive contact gateway uniting information cards with a responsive messaging form.
  * `contactInfoBlock`: Focused side-by-side block for physical address, phone, and direct email links.
  * `contactFormSection`: Full-width styled form optimized for collecting incoming general leads.
* **Full-Page Specialty Blocks:**
  * `servicesPageBlock`: Dedicated services section layout with dense details and price descriptors.
  * `pricingPageBlock`: Visual pricing cards supporting toggleable monthly/annual terms and lists of features.
  * `testimonialsPageBlock`: Full-width review layout supporting search, categorization, and sorting.
  * `caseStudyDetailBlock`: Rich text/image composite layout to display an in-depth portfolio review.
* **Interactive App Blocks:**
  * `reservationBlock`: End-to-end client booking interface incorporating dynamic schedules and real-time conflict-checking.

---

### 5.2 Guest-Facing Runtime HTTP APIs (Public)

In production environments, public-facing forms and widgets query Azure Functions directly from the browser. For local development and testing, Next.js server Route Handlers are provided:

| Route Path | Allowed HTTP Method | Request Input | Expected JSON Response Payload | Underlying Purpose |
|---|---|---|---|---|
| `/api/booking-services` | `GET` | Optional: `?clientId` | `{ services: AdminBookingService[] }` | Queries the catalog of bookable options to render in the client reservation widget. |
| `/api/availability` | `GET` | Required: `clientId`, `date`, `duration` | `{ bookedSlots: string[], outOfWindowSlots: string[] }` | Compares scheduled weekly hours + custom date exceptions against confirmed bookings to return available slots. |
| `/api/reservation` | `POST` | Required: JSON Booking Body | `{ ok: true, reservationId: string }` | Validates inputs, creates a confirmed booking, and locks down the selected time slot. |
| `/api/contact` | `POST` | Required: JSON Contact Body | `{ ok: true }` | Accepts general inquiries and forwards them to configured administrative email handlers. |

---

### 5.3 Merchant Administrative SPA Portal

The administrative client surface is structured under `app/admin/` and compiled into a single shared Static Web App deployment. 

#### A. Core Auth & Security Framework
* **`AdminAuthContext` (`lib/admin-auth-context.tsx`):** Maintains reactive session state in `sessionStorage` (protecting against tab persistence leaks). Boots on reload by sending a validation ping to `/auth/me`.
* **Cookie-Based Security:** HS256 JWTs (`jose`) are written into an `httpOnly` cookie named `admin-session`, signed with `ADMIN_JWT_SECRET` (min 32 chars). This eliminates access to session tokens via browser scripts and neutralizes XSS vulnerabilities.
* **Route Protection:** Deployed SPA routes utilize NextJS Client Router Guards to force-redirect unauthenticated users back to `/admin/login`, whereas Local Dev mounts an Edge Middleware proxy (`proxy.ts`) that verifies the same JWT on protected page and API requests.

#### B. Administrative Route Mapping

All admin sections run purely on the client side:

```
app/admin/
├── layout.tsx                    # Shared AdminAuthProvider wrapping all client routes
├── login/
│   └── page.tsx                  # AdminLoginForm (Credentials + Client ID selector)
└── (dashboard)/
    ├── layout.tsx                # Session guard & AdminShell wrapper
    ├── page.tsx                  # Base redirect wrapper -> lands on bookings calendar
    ├── bookings/
    │   └── page.tsx              # AdminBookingsPage (Timeline & calendars)
    ├── services/
    │   └── page.tsx              # AdminServicesPage (Catalog & Service editor)
    ├── availability/
    │   └── page.tsx              # AdminAvailabilityPage (Schedules & Custom exceptions)
    └── settings/
        └── page.tsx              # Settings placeholder
```

#### C. Embedded Merchant Management Tools
1. **The Bookings Calendar (`/admin/bookings`):**
   * **Multi-View Calendars:** Support toggling between vertical 24-hour day timelines and multi-day weekly grid views.
   * **Detail Inspector:** Interactive sliding panel displaying customer details, selected service, dates, and action buttons.
   * **Direct Actions:** Instant calendar status modifications (Cancel booking, mark customer as No-Show with record keeping).
   * **Manual Scheduling Modal:** Allows business managers to input custom appointments over the counter, running the same real-time conflict-checking logic as the public widget.
2. **The Service Catalog Editor (`/admin/services`):**
   * **Dynamic CRUD Interface:** Real-time creation, editing, and deletion of services.
   * **Operational Rules:** Setup of price points, default currencies, and duration parameters in minutes (which dynamically governs booking widget slot sizes).
   * **Visual Drag Reordering:** Supports drag-and-drop sequencing of services, adjusting the display order for the public site widget.
3. **The Interactive Schedule Planner (`/admin/availability`):**
   * **Standard Weekly Calendar:** Standard toggle and interval editor mapping working slots for every weekday (Monday through Sunday).
   * **Calendar Exception Manager:** Allows administrators to register custom one-off dates (e.g., declaring holiday closures, early office shutdowns, or extended seasonal shifts).

---

## 6. Current Implementation Milestones & Roadmap

Our pipeline uses a progressive rollout. The current status of development tasks outlines the immediate technical roadmap:

```
┌────────────────────────────────────────────────────────────────────────┐
│                              TASK PROGRESS                             │
└────────────────────────────────────────────────────────────────────────┘
 [✓] Task 01: Deploy Azure Static Workflow (STABLE)
     - Successfully resolved and deployed the GitHub Actions pipelines.
     - Implemented twin preparation exports for separate public and admin builds.

 [✓] Task 02: Add Admin Auth Context & Unit Tests (STABLE)
     - Configured Jest and Testing Library specs for client-side Auth Context.
     - Secured local session validation, login, and cookie cleanup routines.

 [▶] Task 03: Setup Cosmos DB Admin Containers (IN PROGRESS / READY)
     - Establish multi-tenant databases in Cosmos DB for administrative tasks.
     - Schema seed setups for `admin-users`, `booking-services`, `booking-schedules`, and `reservations`.

 [✓] Task 04: Implement Admin Azure Functions (STABLE)
     - Admin API moved to Azure Functions with Cosmos DB persistence.
     - HS256 JWT auth (`admin-session` cookie, `ADMIN_JWT_SECRET`, `jose`) shared with local Next.js route handlers.

 [ ] Task 05: Configure Unified Admin Deployment Pipeline (BACKLOG)
     - Connect the Static Web Apps build with live multi-tenant Azure Function routing.
```

### Next Steps: To be defined by this meeting
