# Task: Fix Deploy Workflow + Add basePath Support (T-C)

**Status:** Ready for development
**Priority:** Critical — every demo deploy fails without this fix
**Owner:** devops
**Estimated scope:** Small — 30 min
**Depends on:** None (can be done in parallel with T-A and T-B)
**Milestone:** M0 (Week 1)
**Source:** `docs/meetings/summaries/2026-07-24-pivot-mobile-repair-shops-spain.md`

---

## Context

Two hard blockers prevent demo sites from deploying:

**Blocker 1:** `.github/workflows/deploy-blob-storage.yml` calls `exit 1` when the `BOOKING_API_URL` and `COMPANY_PROFILE_BUILD_TOKEN` environment variables are missing. These were required for the booking-backend architecture. On the static pivot, those variables no longer exist — and the workflow fails before the build even starts. Every demo deploy is dead on line 54.

**Blocker 2:** The platform generates demo sites under path prefixes (e.g., `reparaciones-madrid.es/tienda-x/`) to keep all demos in a single Azure Storage container. Next.js exports all assets with absolute paths (`/_next/...`) by default, which 404 under a sub-path. The fix is one line in `next.config.ts`: `basePath: process.env.BASE_PATH || undefined`. This allows the demo generator to pass `BASE_PATH=/tienda-x` per build so that all asset and internal link paths are correctly prefixed.

---

## Technical Specifications

### Fix 1: Remove `exit 1` guards in `deploy-blob-storage.yml`

Locate the block that checks for `BOOKING_API_URL` and `COMPANY_PROFILE_BUILD_TOKEN` and exits on missing values. Remove those guards entirely. The application code degrades gracefully when these are unset — the workflow wrapper should not be stricter than the app itself.

If other env var checks exist for Azure Functions or Cosmos, remove those as well. The only env vars the static build legitimately needs are:
- `CLIENT_ID` — which client to build
- `BASE_PATH` — optional path prefix for sub-path hosting
- `AZURE_STORAGE_*` — for the upload step only, after the build

Also remove or comment out any step that seeds Cosmos DB or calls the admin API as part of the deploy workflow.

### Fix 2: Add `basePath` to `next.config.ts`

Add the following to the Next.js config:

```ts
basePath: process.env.BASE_PATH || undefined,
```

This must be placed inside the config object that is active when `npm run build:blob` is called. Verify that `trailingSlash: true` is already set (it should be for blob targets) — if not, add it.

**Empirical verification required:** After adding `basePath`, run a test build with `BASE_PATH=/test-shop` and confirm that:
- Internal `next/link` hrefs (e.g., `/servicios`) resolve to `/test-shop/servicios` in the output HTML.
- Raw `href` strings in client JSON configs (e.g., `"href": "/servicios"`) are either correctly prefixed by Next.js or must be substituted at config-write time by `generate-demos.mjs` (document which approach applies).
- `/_next/` asset paths in the output become `/test-shop/_next/`.

Document the finding in a comment in `next.config.ts` so future agents know whether raw JSON hrefs need prefix substitution.

---

## Requirements

- [ ] Remove the `exit 1` guards for `BOOKING_API_URL` and `COMPANY_PROFILE_BUILD_TOKEN` from `.github/workflows/deploy-blob-storage.yml`.
- [ ] Remove or skip any Cosmos seeding or admin API steps in the workflow.
- [ ] Add `basePath: process.env.BASE_PATH || undefined` to `next.config.ts`.
- [ ] Confirm `trailingSlash: true` is set for blob builds.
- [ ] Run a test build with `BASE_PATH=/test-shop` and verify asset and link paths are correctly prefixed.
- [ ] Document in a comment whether raw JSON `href` strings need prefix substitution at config-write time.

---

## Files touched

| Area | Paths |
|---|---|
| CI workflow | `.github/workflows/deploy-blob-storage.yml` (modified) |
| Next.js config | `next.config.ts` (modified) |

---

## Out of scope

- Changes to the upload or sync step of the workflow (that is Task T-E scope).
- Any changes to client configs or templates.
- Adding new workflow files.

---

## Acceptance criteria

1. `CLIENT_ID=demo-phone-repair-shop npm run build:blob` completes with exit code 0 in a completely clean environment (no booking API URL, no Cosmos token, no admin URL).
2. A build with `BASE_PATH=/test-shop CLIENT_ID=demo-phone-repair-shop npm run build:blob` produces output where `/_next/` asset references are prefixed as `/test-shop/_next/`.
3. Internal navigation links (e.g., to `/servicios`) resolve correctly under the path prefix.
4. The deploy workflow job does not fail on missing booking-backend env vars.
