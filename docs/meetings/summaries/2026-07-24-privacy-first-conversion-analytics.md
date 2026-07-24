# Meeting Summary: Privacy-First Conversion Analytics

**Date:** 2026-07-24  
**Agents present:** CTO, nextjs-frontend-developer  
**Topic:** Feature Spec: Privacy-First Conversion Analytics (SaaS)

---

## Context

To prove ROI to non-technical clients, the platform needs a lightweight, privacy-focused analytics system that tracks core conversion events (WhatsApp clicks, phone call clicks, etc.) without legal friction (GDPR/ePrivacy compliance).

**Core requirements from spec:**
1. Event-driven, cookieless, server-side architecture
2. Zero-PII ingestion (no IP logging, no user identifiers, aggregate counter format)
3. Zero 3rd-party scripts, non-blocking fire-and-forget requests, minimal overhead for Lighthouse scores

**Architectural constraint discovered:** Public client sites are pure SSG deployed to Azure Blob Storage. The `app/api/` directory is stripped at build time via `prepare-static-export.mjs`. Therefore `/api/v1/telemetry` as a Next.js Route Handler does not exist in production — ingestion must be an Azure Function, following the same pattern as `createReservation` and contact endpoints.

---

## Agent Key Points

### CTO (condensed)

- **Classification:** architectural-decision
- **Directive:** Ship as a cookieless Azure Function (`POST /telemetry`) writing day-bucketed aggregate counters to Cosmos, fired from a single delegated click listener in the site layout.
- Production endpoint is an Azure Function, not a Next.js route handler. Dev-only Route Handler at `app/api/telemetry/route.ts` for local parity.
- URL baked into client bundle as `NEXT_PUBLIC_TELEMETRY_URL` at blob-build time (mirror `NEXT_PUBLIC_BOOKING_API_URL`). Opt-in per tenant if unset.
- Zero-PII is a server discipline: handler must never read/write IP; Application Insights must be configured to not capture client IP.
- Storage: one Cosmos document per `(site_id, YYYY-MM-DD)` with atomic Patch increment — not per-event rows. Protects cost moat and matches aggregate counter format.
- CORS: reflect origin, no credentials (scales to 100+ custom domains).
- Transport: `sendBeacon` with `text/plain` JSON body to avoid CORS preflight that beacons cannot satisfy.
- Failure modes: bot/counter inflation (add `site_id` allowlist), App Insights IP capture (DevOps task).

### nextjs-frontend-developer (condensed)

- Agrees with single delegated listener — per-anchor handlers would require converting many server components to `'use client'`, harming Lighthouse scores.
- CTAs live across many components: `BottomCtaBar.tsx`, `ContactInfoBlock.tsx`, `ContactBlock.tsx`, headers, hero buttons. Most are server components.
- One tiny client component in the `(site)` layout using capture-phase event delegation on `a[href]`.
- Detect `tel:` for phone, regex for `wa.me`, `api.whatsapp.com`, `wa.link` for WhatsApp.
- Zero client persistence confirmed: no state, cookies, or localStorage.
- Mount in site-group layout, not root `app/layout.tsx` — keeps telemetry off admin SPA.
- Needs `NEXT_PUBLIC_CLIENT_ID` exposed at blob-build time (not currently in client bundle).
- Bundle cost ~0.4 KB gzipped, one listener, zero dependencies.
- Gap: no admin surface yet to display conversion data — follow-up task required for ROI objective.

---

## Meeting Summary

### Decisions / Recommendations

1. **Prod endpoint = Azure Function** `POST /telemetry` (anonymous), not a Next route handler. Dev-only `app/api/telemetry/route.ts` for local parity. URL baked as `NEXT_PUBLIC_TELEMETRY_URL`; component renders nothing if unset (opt-in per tenant).

2. **Storage = day-bucketed aggregate counters** in Cosmos:
   ```json
   {
     "id": "tenant_123:2026-07-24",
     "site_id": "tenant_123",
     "date": "2026-07-24",
     "counters": { "click_whatsapp": 12, "click_phone": 5 }
   }
   ```
   Partition key `site_id`, atomic Patch `incr`. No per-event rows.

3. **Capture = one delegated capture-phase click listener** in the `(site)` layout. Keeps CTA components as server components; preserves 100/100 Lighthouse.

4. **Transport = `sendBeacon` with `text/plain` JSON blob** (fetch `keepalive` fallback) to avoid CORS preflight.

5. **CORS = reflect origin, credentials off** — scales to 100+ domains, safe because unauthenticated.

### Points of Alignment

- Cookieless, zero client persistence, zero third-party scripts — unanimous and architecturally trivial.
- Do not instrument per-anchor; delegation is the only Lighthouse-safe path.
- Aggregate-not-append is both a compliance win and a cost win.

### Unresolved Tensions / Open Questions

- **App Insights captures client IP by default** — must be explicitly configured off, or the "No IP logging" guarantee is violated server-side. Owner: DevOps.
- **Spec says `/api/v1/telemetry`** but that route cannot exist on a static blob site — resolved to Azure Function pattern; confirm product is OK with URL differing.
- **Bot/counter inflation** on anonymous endpoint — accept low fidelity + `site_id` allowlist guard; revisit if client disputes numbers.
- **Does `mailto:` count as a conversion?** Left out to match spec exactly — needs CPO ruling.
- **No admin surface to display data yet** — follow-up task (`GET /telemetry/summary` + admin card) required for ROI objective.

### Suggested Next Actions

1. **Backend task:** `azure-functions/src/functions/telemetry.ts` + `telemetryStore.ts` (Cosmos Patch, ≤120 LOC, offline Vitest).
2. **Frontend task:** `components/analytics/ConversionTelemetry.tsx` + mount in `(site)` layout + add `NEXT_PUBLIC_CLIENT_ID` / `NEXT_PUBLIC_TELEMETRY_URL` to build env.
3. **DevOps task:** Disable App Insights client-IP capture; document zero-PII posture.
4. **CPO/CEO:** Rule on `mailto:` and scope the admin "conversions this month" card.
