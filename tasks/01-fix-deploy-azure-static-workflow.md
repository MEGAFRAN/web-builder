# Task: Fix deploy-azure-static.yml and gitignore gaps

**Status:** Ready for development  
**Priority:** High — `deploy-azure-static.yml` is broken; any SWA client deploy will fail  
**Owner:** DevOps / Frontend  
**Estimated scope:** Small — two file changes, no logic  
**Depends on:** nothing

---

## Context

After the blob build fix (`fix-static-export-blob-deploy`), `npm run build:blob` correctly excludes server-only routes via `scripts/prepare-static-export.mjs`. However, `deploy-azure-static.yml` still calls `npm run build` — the bare Next.js build — which also uses `output: 'export'` (see `next.config.ts`) and therefore fails with the same error:

```
Error: Page "/api/admin/reservations/[id]" is missing "generateStaticParams()"
so it cannot be used with "output: export" config.
```

Additionally, `scripts/prepare-admin-export.mjs` creates a `.admin-excluded/` temp directory during `npm run build:admin`, but that path is not listed in `.gitignore`. If a developer accidentally stages files during a build, the displaced source dirs could appear in a commit.

---

## Changes required

### 1. `deploy-azure-static.yml` — use `build:blob` instead of `build`

```yaml
# Before
- name: Build static site
  run: |
    echo "CLIENT_ID=${{ github.event.inputs.clientId }}" > .env.local
    npm run build

# After
- name: Build static site
  run: |
    echo "CLIENT_ID=${{ github.event.inputs.clientId }}" > .env.local
    npm run build:blob
```

`npm run build:blob` runs `scripts/prepare-static-export.mjs`, which excludes `app/api/` and `app/admin/` before calling `next build`, then restores them. This is the only supported static-export entry point.

### 2. `.gitignore` — add `.admin-excluded/`

```
# admin-build temp dir (created by scripts/prepare-admin-export.mjs, always restored)
/.admin-excluded/
```

---

## Requirements

- [ ] `deploy-azure-static.yml` build step uses `npm run build:blob`
- [ ] `.gitignore` includes `/.admin-excluded/`
- [ ] No other changes to CI workflow logic, action versions, or deploy step

---

## Files touched

| File | Change |
|---|---|
| `.github/workflows/deploy-azure-static.yml` | Line 48: `npm run build` → `npm run build:blob` |
| `.gitignore` | Add `/.admin-excluded/` entry |

---

## Acceptance criteria

1. A dry-run of `deploy-azure-static.yml` (or a local `npm run build:blob` with any valid `CLIENT_ID`) exits 0
2. `git status` after `npm run build:admin` shows `.admin-excluded/` as untracked but **not** staged or committed
3. `npm test` passes
