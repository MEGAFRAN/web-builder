# Task: Fix Tenant Isolation Bug in `company-profile-local.json` (T-H)

**Status:** Ready for development
**Priority:** Critical — must be fixed BEFORE the first batch demo generation run
**Owner:** nextjs-frontend-developer
**Estimated scope:** Small — 30 min
**Depends on:** None
**Milestone:** M0 (Week 1, before T-D first run)
**Source:** `docs/meetings/summaries/2026-07-24-pivot-mobile-repair-shops-spain.md`

---

## Context

`data/company-profile-local.json` is a **single global file** that currently contains real business data (reportedly a hair salon in Oviedo). The `getCompanyProfile()` function falls back to this file whenever `CLIENT_ID` is set to the client that owns this local data.

When `generate-demos.mjs` (Task T-D) builds 50 demo sites in sequence, each build runs with a different `CLIENT_ID`. If any of those builds falls through to the global fallback, they will expose another business's phone number, name, and address in a prospect's demo site.

This is a cross-tenant data leak. It must be fixed before the first batch run, not after.

The fix does not need to be complex. Option A is safest.

---

## Technical Specifications

### Option A (preferred): return `null` or empty object when no client-scoped file exists

In the function that reads `company-profile-local.json`, replace the global file fallback with a client-scoped path lookup:

```
data/company-profile-local.json        ← REMOVE this global file or rename to company-profile-demo.json
data/clients/{clientId}/company-profile.json  ← per-client local file (optional)
```

If no per-client file exists, return `null` or an empty object `{}`. **Do not fall back to a global file.**

The application must handle a `null` company profile gracefully — render empty strings or skip optional fields. It must not crash or throw.

### Option B (alternative): delete `data/company-profile-local.json` entirely

If the global file is not referenced in any active code path during `npm run build:blob`, simply delete it and update any import that references it to handle `undefined`/`null`.

Prefer Option A if the file is referenced in multiple places. Use Option B if it is only read in one place and the reference is easy to remove.

### Investigation required

Before implementing, check:
1. How many places does `getCompanyProfile()` or equivalent read this file?
2. Is it called during `npm run build:blob`? If not, the leak may not be active — but fix it anyway.
3. Does any component crash when profile returns `null`? Fix those crash cases as part of this task.

### What must NOT change

- Do not modify any client configs under `config/clients/`.
- Do not modify any template files.
- Do not modify schema files.

---

## Requirements

- [ ] Audit all callers of `getCompanyProfile()` or direct imports of `company-profile-local.json`.
- [ ] Remove the global file fallback — return `null` or `{}` when no client-scoped profile exists.
- [ ] Handle `null` profile gracefully in all callers (no crashes, no uncaught exceptions).
- [ ] Optionally move the existing global file to `data/clients/demo-phone-repair-shop/company-profile.json` so the demo client retains its data.
- [ ] Confirm that `CLIENT_ID=demo-phone-repair-shop npm run build:blob` still produces a correct build after the fix.

---

## Files touched

| Area | Paths |
|---|---|
| Data file | `data/company-profile-local.json` (removed or moved) |
| Profile loader | The file containing `getCompanyProfile()` (modified) |
| Callers | Any component or lib that uses the profile and may crash on null (modified) |

---

## Out of scope

- Any changes to production API calls (this fix is local/build-time only).
- Changes to client config schemas.

---

## Acceptance criteria

1. Building with `CLIENT_ID=demo-phone-repair-shop npm run build:blob` does NOT produce output containing data from any other business (verify by grepping the output for the hair salon's name or Oviedo).
2. Building with `CLIENT_ID=nonexistent-client npm run build:blob` does not crash with an unhandled exception — it returns empty/null profile gracefully.
3. The fix is confirmed before `generate-demos.mjs` is run for the first time.
4. `npm run validate` passes after the fix.
