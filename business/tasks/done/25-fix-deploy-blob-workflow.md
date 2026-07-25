# Task: Fix Deploy Blob Workflow for Static Builds (T-C)

**Status:** Done — completed July 25, 2026
**Priority:** Critical — every demo deploy fails without this fix
**Owner:** devops
**Estimated scope:** Small — 30 min
**Depends on:** None (can be done in parallel with T-A and T-B)
**Milestone:** M0 (Week 1)
**Source:** `docs/meetings/summaries/2026-07-24-pivot-mobile-repair-shops-spain.md`

---

## Context

`.github/workflows/deploy-blob-storage.yml` called `exit 1` when the `BOOKING_API_URL` and `COMPANY_PROFILE_BUILD_TOKEN` environment variables were missing. These were required for the booking-backend architecture. On the static pivot, those variables no longer exist — and the workflow failed before the build even started. Every demo deploy was dead on line 54.

**Demo hosting model (locked):** demos deploy to the **root** of an Azure Blob static website endpoint (e.g. `https://{account}.z43.web.core.windows.net/`). No sub-paths, no `BASE_PATH`. One Azure Storage account per vertical demo template (repair shops now; restaurants, bars, gyms, etc. later — each vertical gets its own account).

---

## Technical Specifications

### Static clients (`features.booking: false`)

When `config/clients/{clientId}/client.json` has `"booking": false`, the build step writes only:

- `CLIENT_ID`
- `NEXT_PUBLIC_CLIENT_ID`

No booking-backend env vars are required. The workflow must not fail on missing `ADMIN_API_URL`, `COMPANY_PROFILE_BUILD_TOKEN`, or Cosmos secrets.

### Booking clients (`features.booking: true`)

When `"booking": true`, the workflow automatically:

1. Requires `ADMIN_API_URL` and `COMPANY_PROFILE_BUILD_TOKEN` (fail with clear error if missing)
2. Writes full booking env vars to `.env.local` (including optional `bookingServicesEndpoint` from `client.json`)
3. Runs the Cosmos seed step (skips gracefully if `COSMOS_*` secrets are unset)

Mode is resolved by a **Resolve client build mode** step that reads `features.booking` from `client.json` — no manual workflow checkbox.

### No `basePath` changes

Demos and paying clients both build for root `/`. Do **not** add `basePath` to `next.config.ts` for this pivot — it is not needed and would add complexity.

---

## Requirements

- [x] Remove unconditional `exit 1` guards for booking-backend env vars from `.github/workflows/deploy-blob-storage.yml`.
- [x] Static builds (`features.booking: false`) use `CLIENT_ID` only — no booking secrets required.
- [x] Booking builds (`features.booking: true`) restore booking env injection and Cosmos seeding.
- [x] Auto-detect build mode from `config/clients/{clientId}/client.json` → `features.booking`.
- [x] Confirm `trailingSlash: true` is set for blob builds (already present in `next.config.ts`).
- [x] Do not add `basePath` support — demos deploy at blob endpoint root.

---

## Files touched

| Area | Paths |
|---|---|
| CI workflow | `.github/workflows/deploy-blob-storage.yml` (modified) |

---

## Out of scope

- Upload script for demos — superseded by `.github/workflows/deploy-demo-swa.yml` (Task T-D / `31-deploy-generic-demo-site.md`).
- Vanity domain DNS (founder + Task T-D docs).
- Changes to client configs or templates (workflow reads `features.booking`; clients set it themselves).
- `basePath` or sub-path hosting.

---

## Acceptance criteria

1. `CLIENT_ID=demo-phone-repair-shop npm run build:blob` completes with exit code 0 in a completely clean environment (no booking API URL, no Cosmos token, no admin URL). ✓
2. The deploy workflow job does not fail on missing booking-backend env vars when `features.booking` is `false`. ✓
3. Built output uses root paths (`/_next/`, `/servicios/`) with no path prefix. ✓
4. When `features.booking` is `true`, the workflow requires booking secrets and runs the Cosmos seed step. ✓

---

## Implementation notes

**Initial fix:** Removed unconditional booking env guards and Cosmos seeding so static pivot demos could deploy.

**Follow-up (same day):** Re-introduced booking support behind `features.booking` in `client.json` so blob deploy supports both modes from one workflow without a manual checkbox:

```
Resolve client build mode  →  read features.booking from client.json
Build static site          →  branch on booking_enabled output
Seed Cosmos (conditional)  →  only when features.booking=true
Azure login + blob sync    →  unchanged
```

**To deploy a booking site to blob later:** set `"booking": true` in the client's `client.json`, ensure Azure Functions + GitHub secrets are configured, run the workflow with that `clientId`. Reference pattern also preserved in `.github/workflows/deploy-swa.yml`.
