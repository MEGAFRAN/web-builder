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

The platform pivoted to static-only. The core architectural guarantee is: no client config may reference a runtime backend endpoint. If a `servicesEndpoint`, `bookingServicesEndpoint`, or similar key ever appears in a client config, the demo or paying site will silently depend on a backend that no longer exists — and render blank sections with no error.

This CI check is a regression guard. It costs 30 minutes to ship and protects the entire demo pipeline from silent backend drift for the lifetime of the project.

---

## Technical Specifications

### What to check

Add a CI step (or add to the existing validate workflow) that fails the build if any file matching `config/clients/**/*.json` contains any of these keys:

```
servicesEndpoint
bookingServicesEndpoint
bookingApiUrl
adminApiUrl
reservationEndpoint
```

Use `grep -r` or `ripgrep` in the CI step. Fail with a clear message identifying which file and which key triggered the guard.

### Implementation options

**Option A — shell step in CI workflow (simplest):**

```yaml
- name: Guard against backend config keys
  run: |
    FORBIDDEN_KEYS="servicesEndpoint|bookingServicesEndpoint|bookingApiUrl|adminApiUrl|reservationEndpoint"
    if rg --json "$FORBIDDEN_KEYS" config/clients/; then
      echo "::error::Backend config key found in config/clients/. Remove it before merging."
      exit 1
    fi
```

**Option B — npm script (preferred for local dev use):**

Add `scripts/guard-config-keys.mjs` that runs the same check. Add to `package.json` as `"guard:config"`. Call it from CI. This way agents can run the check locally before pushing.

Use Option B so the check is runnable outside CI.

### Error output format

```
ERROR config/clients/demo-garcia/client.json
  Line 14: "servicesEndpoint" is a forbidden backend config key.
  This field indicates a runtime API dependency. Remove it — the static build does not support it.

1 violation found. Guard failed.
```

### When to run

- On every push (PR and main branch).
- After `npm run validate:client` in the CI pipeline.
- Local: `npm run guard:config` before any PR.

---

## Requirements

- [ ] Write `scripts/guard-config-keys.mjs` that scans `config/clients/**/*.json` for forbidden backend keys.
- [ ] Prints file path, line number, and forbidden key for each violation.
- [ ] Exits with code 1 if any violation found.
- [ ] Add `"guard:config": "node scripts/guard-config-keys.mjs"` to `package.json`.
- [ ] Add CI step to run `npm run guard:config` on every push.

**Forbidden keys (exhaustive list for M0):**

| Key | Reason forbidden |
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

---

## Acceptance criteria

1. `npm run guard:config` exits with code 0 when no client config contains a forbidden key.
2. Adding `"servicesEndpoint": "https://example.com"` to any file under `config/clients/` causes the script to exit with code 1 and print the file path and key name.
3. The CI step fails on a PR that introduces a forbidden key.
4. Template files under `config/templates/` are NOT scanned and do not trigger the guard.
