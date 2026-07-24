# Task: Fix Deploy Blob Workflow for Static Builds (T-C)

**Status:** Ready for development
**Priority:** Critical — every demo deploy fails without this fix
**Owner:** devops
**Estimated scope:** Small — 30 min
**Depends on:** None (can be done in parallel with T-A and T-B)
**Milestone:** M0 (Week 1)
**Source:** `docs/meetings/summaries/2026-07-24-pivot-mobile-repair-shops-spain.md`

---

## Context

`.github/workflows/deploy-blob-storage.yml` calls `exit 1` when the `BOOKING_API_URL` and `COMPANY_PROFILE_BUILD_TOKEN` environment variables are missing. These were required for the booking-backend architecture. On the static pivot, those variables no longer exist — and the workflow fails before the build even starts. Every demo deploy is dead on line 54.

**Demo hosting model (locked):** demos deploy to the **root** of an Azure Blob static website endpoint (e.g. `https://{account}.z43.web.core.windows.net/`). No sub-paths, no `BASE_PATH`. One Azure Storage account per vertical demo template (repair shops now; restaurants, bars, gyms, etc. later — each vertical gets its own account).

---

## Technical Specifications

### Remove `exit 1` guards in `deploy-blob-storage.yml`

Locate the block that checks for `BOOKING_API_URL` and `COMPANY_PROFILE_BUILD_TOKEN` and exits on missing values. Remove those guards entirely. The application code degrades gracefully when these are unset — the workflow wrapper should not be stricter than the app itself.

If other env var checks exist for Azure Functions or Cosmos, remove those as well. The only env vars the static build legitimately needs are:
- `CLIENT_ID` — which client to build
- `AZURE_STORAGE_*` — for the upload step only, after the build

Also remove or comment out any step that seeds Cosmos DB or calls the admin API as part of the deploy workflow.

### No `basePath` changes

Demos and paying clients both build for root `/`. Do **not** add `basePath` to `next.config.ts` for this pivot — it is not needed and would add complexity.

---

## Requirements

- [ ] Remove the `exit 1` guards for `BOOKING_API_URL` and `COMPANY_PROFILE_BUILD_TOKEN` from `.github/workflows/deploy-blob-storage.yml`.
- [ ] Remove or skip any Cosmos seeding or admin API steps in the workflow.
- [ ] Confirm `trailingSlash: true` is set for blob builds (should already be present).
- [ ] Do not add `basePath` support — demos deploy at blob endpoint root.

---

## Files touched

| Area | Paths |
|---|---|
| CI workflow | `.github/workflows/deploy-blob-storage.yml` (modified) |

---

## Out of scope

- Upload script for demos (Task T-D / `31-deploy-generic-demo-site.md`).
- Vanity domain DNS (founder + Task T-D docs).
- Any changes to client configs or templates.
- `basePath` or sub-path hosting.

---

## Acceptance criteria

1. `CLIENT_ID=demo-phone-repair-shop npm run build:blob` completes with exit code 0 in a completely clean environment (no booking API URL, no Cosmos token, no admin URL).
2. The deploy workflow job does not fail on missing booking-backend env vars.
3. Built output uses root paths (`/_next/`, `/servicios/`) with no path prefix.
