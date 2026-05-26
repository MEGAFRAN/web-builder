# Task: Fix admin Azure Functions — reserved `admin` route segment

**Status:** Pending  
**Priority:** Critical — all admin data endpoints (services, schedule, reservations, company profile) return 404 in production  
**Owner:** Backend  
**Estimated scope:** Small — route rename in 5 files + 1 SPA file + rebuild + redeploy  
**Depends on:** Nothing — standalone fix

---

## Root cause

Azure Functions intercepts any request whose path (after stripping the route prefix) starts with `/admin/`. This is because `/admin/...` is Azure's reserved management API prefix (`/admin/host/status`, `/admin/functions/{name}`, etc.). Even with the default `api` route prefix, a function registered with route `admin/services` becomes `/api/admin/services`, which after stripping `api` resolves to `/admin/services` — intercepted by the management handler → **empty 404, function never invoked**.

**Evidence gathered during debugging session:**
- `GET /api/auth/me` → 401 (function runs ✓)
- `GET /api/availability` → 400 (function runs ✓)
- `POST /api/reservations` → 422 (function runs ✓)
- `GET /api/admin/services` → 404, `Content-Length: 0` (function never invoked ✗)
- `GET /api/admin/schedule` → 404, `Content-Length: 0` (function never invoked ✗)
- `GET /api/admin/reservations` → 404, `Content-Length: 0` (function never invoked ✗)
- Portal invocation count: 0 even after direct portal test
- Deploy output lists all functions correctly — conflict is at routing time, not registration

The auth functions (`authLogin`, `authLogout`, `authMe`) are NOT affected because their routes start with `auth/`, not `admin/`.

---

## Fix

Rename all 5 admin function routes from `admin/X` → `mgmt/X` (a non-reserved segment). Update the SPA's `adminDataUrl` helper to use the new segment for remote calls. Local Next.js route handlers (`app/api/admin/`) are **not touched** — they serve local dev only and are unaffected.

### 1. Azure Functions — rename routes (`azure-functions/src/functions/admin/`)

| File | Old `route` | New `route` |
|---|---|---|
| `services.ts` | `admin/services` | `mgmt/services` |
| `schedule.ts` | `admin/schedule` | `mgmt/schedule` |
| `reservations.ts` | `admin/reservations` | `mgmt/reservations` |
| `reservationById.ts` | `admin/reservations/{id}` | `mgmt/reservations/{id}` |
| `companyProfile.ts` | `admin/company-profile` | `mgmt/company-profile` |

In each file, change **only** the `route:` field inside `app.http(...)`. Also update the `logLabel` string passed to `handleHttpError` for accurate logging (e.g. `'admin/services'` → `'mgmt/services'`).

Example for `services.ts` (lines 50 and 54–59):
```typescript
// Before
return handleHttpError(err, origin, methods, 'admin/services', context)
// ...
app.http('adminServices', {
  methods: ['GET', 'PUT', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'admin/services',
  handler,
})

// After
return handleHttpError(err, origin, methods, 'mgmt/services', context)
// ...
app.http('adminServices', {
  methods: ['GET', 'PUT', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'mgmt/services',
  handler,
})
```

Apply the same pattern to `schedule.ts`, `reservations.ts`, `reservationById.ts`, `companyProfile.ts`.

### 2. SPA — update `adminDataUrl` (`lib/admin-api.ts`)

Change line 35 only (the remote branch). Local dev branch (line 37) stays as-is.

```typescript
// Before
export function adminDataUrl(path: string): string {
  if (REMOTE_BASE) {
    return `${REMOTE_BASE}/admin${path}`   // ← change this
  }
  return `/api/admin${path}`               // ← leave this unchanged
}

// After
export function adminDataUrl(path: string): string {
  if (REMOTE_BASE) {
    return `${REMOTE_BASE}/mgmt${path}`    // ← updated
  }
  return `/api/admin${path}`               // ← unchanged
}
```

**Why local stays the same:** local dev hits Next.js route handlers at `app/api/admin/*`, which are unaffected by this change. Only the remote (Azure Functions) path changes.

---

## Deploy steps (run in order)

### Step 1 — Build and publish Azure Functions

```bash
cd azure-functions
npm run build
func azure functionapp publish web-builder-api
```

After publish, verify the output lists all 11 functions with the new `mgmt/` invoke URLs:
```
adminServices - [httpTrigger]
    Invoke url: .../api/mgmt/services
```

Smoke test immediately:
```bash
# Should return 401 (function runs, no token)
curl -i https://web-builder-api-hwathufterhjdtdk.eastus-01.azurewebsites.net/api/mgmt/services
```

### Step 2 — Rebuild and redeploy admin SPA

The SPA must be rebuilt because `adminDataUrl` is baked into the client bundle at build time.

Trigger the `deploy-admin.yml` GitHub Actions workflow (Settings → Actions → Deploy Admin SPA → Run workflow), or run locally:

```bash
NEXT_PUBLIC_ADMIN_API_URL=https://web-builder-api-hwathufterhjdtdk.eastus-01.azurewebsites.net/api \
CLIENT_ID=<your-client-id> \
npm run build:admin
```

Then deploy the `out/` directory to Azure Static Web Apps.

---

## Verification

After both deploys:

1. Open `/admin/services` in the browser
2. Add a new service and save
3. Network tab → PUT should return **200** `{ "ok": true }`
4. Azure Portal → `adminServices` → Monitor → Invocations should show the call

Also verify these still work (should be unaffected):
- Login / logout / auth/me
- Public booking widget (getAvailability, createReservation)

---

## Files changed

| File | Change |
|---|---|
| `azure-functions/src/functions/admin/services.ts` | `route: 'admin/services'` → `'mgmt/services'` |
| `azure-functions/src/functions/admin/schedule.ts` | `route: 'admin/schedule'` → `'mgmt/schedule'` |
| `azure-functions/src/functions/admin/reservations.ts` | `route: 'admin/reservations'` → `'mgmt/reservations'` |
| `azure-functions/src/functions/admin/reservationById.ts` | `route: 'admin/reservations/{id}'` → `'mgmt/reservations/{id}'` |
| `azure-functions/src/functions/admin/companyProfile.ts` | `route: 'admin/company-profile'` → `'mgmt/company-profile'` |
| `lib/admin-api.ts` | `adminDataUrl` remote branch: `/admin${path}` → `/mgmt${path}` |

No other files need changing. Local Next.js route handlers, tests, and architecture docs are unaffected by this rename.
