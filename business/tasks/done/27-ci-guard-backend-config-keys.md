# Task: CI Guard Against Backend Config Keys (T-J)

**Status:** Ready for development
**Priority:** Medium — prevents silent regression to backend dependency
**Owner:** devops
**Estimated scope:** Small — 30 min
**Depends on:** None (can run in parallel)
**Milestone:** M0 (Week 1)
**Source:** `docs/meetings/summaries/2026-07-24-pivot-mobile-repair-shops-spain.md`

---

## Context

The platform pivoted to static-only for M0 (Clubtal brochure sites). The core architectural guarantee for **static clients** is: no client config with `"booking": false` may reference a runtime backend endpoint. If a `servicesEndpoint`, `bookingServicesEndpoint`, or similar key appears in a static client config, the demo or paying site will silently depend on a backend that no longer exists — and render blank sections with no error.

**Exception (T-C / `25-fix-deploy-blob-workflow.md`):** `.github/workflows/deploy-blob-storage.yml` reads `features.booking` from `client.json`. When `"booking": true`, the workflow legitimately injects Azure Functions env vars and may read `bookingServicesEndpoint`. The guard must **not** flag backend keys on booking-enabled clients — only on static clients.

This CI check is a regression guard for the static pivot. It protects the demo pipeline from silent backend drift while leaving a path open to re-enable booking later.

---

## Technical Specifications

### What to check

Scan every `config/clients/{clientId}/client.json`. For each file:

1. Parse JSON and read `features.booking`.
2. If `features.booking === true` → **skip** (booking client; backend keys allowed).
3. If `features.booking === false` or missing → fail if the file contains any forbidden key (at any nesting depth).

**Forbidden keys (static clients only):**

```
servicesEndpoint
bookingServicesEndpoint
bookingApiUrl
adminApiUrl
reservationEndpoint
companyProfileEndpoint
```

Use `scripts/guard-config-keys.mjs` (Option B below). Fail with a clear message identifying file, key, and that the client has `features.booking: false`.

### Implementation

**Option B — npm script (required):**

Add `scripts/guard-config-keys.mjs` that:

1. Glob `config/clients/*/client.json`.
2. Parse each file; read `features.booking`.
3. Skip files where `features.booking === true`.
4. For all others, scan for forbidden keys (walk nested objects or regex with line numbers).
5. Exit 1 on any violation.

Add to `package.json` as `"guard:config"`. Call from CI. Agents can run locally before pushing.

Do **not** use a blind `rg` over all JSON files — that would incorrectly flag future booking clients.

### Error output format

```
ERROR config/clients/demo-garcia/client.json
  Line 14: "servicesEndpoint" is forbidden when features.booking is false.
  Static clients must not reference runtime APIs — remove the key or set features.booking to true (booking product only).

1 violation found. Guard failed.
```

### When to run

- On every push (PR and main branch).
- After `npm run validate:client` in the CI pipeline.
- Local: `npm run guard:config` before any PR.

---

## Requirements

- [ ] Write `scripts/guard-config-keys.mjs` that scans `config/clients/*/client.json` for forbidden backend keys.
- [ ] Skip clients where `features.booking === true`.
- [ ] Flag violations only when `features.booking === false` or `features` is missing.
- [ ] Print file path, line number, and forbidden key for each violation.
- [ ] Exits with code 1 if any violation found.
- [ ] Add `"guard:config": "node scripts/guard-config-keys.mjs"` to `package.json`.
- [ ] Add CI step to run `npm run guard:config` on every push.

**Forbidden keys (static clients — exhaustive list for M0):**

| Key | Reason forbidden (when `booking: false`) |
|---|---|
| `servicesEndpoint` | Runtime services API |
| `bookingServicesEndpoint` | Runtime booking catalog API |
| `bookingApiUrl` | Runtime booking submission API |
| `adminApiUrl` | Admin backend API |
| `reservationEndpoint` | Runtime reservation API |
| `companyProfileEndpoint` | Runtime profile API |

---

## Files touched

| Area | Paths |
|---|---|
| New script | `scripts/guard-config-keys.mjs` (new) |
| Package scripts | `package.json` (modified — add `guard:config`) |
| CI workflow | `.github/workflows/validate.yml` (modified — add step) |

---

## Out of scope

- Scanning template files (templates may legitimately reference these fields as documentation).
- Scanning component source files.
- Auto-fixing violations.
- Blocking `features.booking: true` on any client (booking reactivation is supported via T-C workflow).

---

## Acceptance criteria

1. `npm run guard:config` exits with code 0 when no **static** client config contains a forbidden key.
2. Adding `"servicesEndpoint": "https://example.com"` to a client with `"booking": false` causes exit code 1 with file path and key name.
3. A client with `"booking": true` and `"bookingServicesEndpoint": "https://..."` does **not** trigger the guard.
4. The CI step fails on a PR that introduces a forbidden key on a static client.
5. Template files under `config/templates/` are NOT scanned and do not trigger the guard.
