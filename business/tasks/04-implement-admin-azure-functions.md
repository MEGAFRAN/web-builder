# Task: Implement admin Azure Functions

**Status:** Ready for development  
**Priority:** High — blocks the admin SPA from working in any deployed environment  
**Owner:** Backend  
**Estimated scope:** Large — 10 endpoints, JWT auth, Cosmos DB integration  
**Depends on:** `setup-cosmos-db-admin-containers` (containers and seed data must exist)

---

## Context

The admin SPA (`app/admin/`) calls its backend via `lib/admin-api.ts`. When `NEXT_PUBLIC_ADMIN_API_URL` is set (all deployed environments), every call goes to Azure Functions. When it is not set (local dev), calls fall back to the local Next.js Route Handlers in `app/api/admin/`.

The Azure Functions project lives in `azure-functions/`. It currently contains only the public booking endpoints (`getAvailability`, `createReservation`). The entire admin surface is missing.

---

## Auth model

All admin Functions use **JWT in an `httpOnly` cookie** (`admin-session`). The JWT payload is:

```json
{ "email": "admin@example.com", "clientId": "1", "exp": 1234567890 }
```

- `auth/login` issues the cookie; `auth/logout` clears it; all other Functions validate it
- `clientId` is **always** read from the validated JWT — never from query params or the request body
- A shared `validateAdminJwt(req)` helper returns `{ email, clientId }` or throws 401

**JWT signing key:** `ADMIN_JWT_SECRET` environment variable (min 32 chars). Must be set in the Azure Functions app settings and in `local.settings.json` for local dev.

---

## Endpoints to implement

### Auth

#### `POST /auth/login`

Request body: `{ email: string, password: string, clientId: string }`

1. Look up the document in `admin-users` where `clientId` matches and `email` matches (case-insensitive)
2. Use timing-safe comparison for email; verify password against `passwordHash` using bcrypt
3. On success: sign a JWT `{ email, clientId, exp: now + 7d }` with `ADMIN_JWT_SECRET`; set as `httpOnly`, `SameSite=Lax`, `Secure` cookie named `admin-session`; return `{ ok: true, email, clientId }`
4. On failure: return 401 `{ error: 'Incorrect email or password' }` (same message regardless of which field was wrong — no user enumeration)
5. If `clientId` is not provided or not found: return 503 `{ error: 'Admin login is not configured.' }`

#### `POST /auth/logout`

Clears the `admin-session` cookie (set `maxAge: 0`). Returns `{ ok: true }`. No JWT validation required.

#### `GET /auth/me`

Validates the JWT. Returns `{ email, clientId }` on success, 401 if invalid or expired.

### Client config

#### `GET /clients/:clientId/config`

Validates the JWT. Returns `{ displayName, logoUrl }` for the requesting client (reads from `admin-users` document or a dedicated `client-config` field). Returns 403 if the JWT's `clientId` does not match the route param — a client admin cannot read another client's config.

### Reservations

#### `GET /admin/reservations?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`

Validates JWT. Queries `reservations` container WHERE `clientId = jwt.clientId AND date >= startDate AND date <= endDate`. Returns `{ reservations: [...] }` sorted by date, then time. Enriches each record with `serviceName` by joining against the `services` container.

#### `POST /admin/reservations`

Validates JWT. Accepts the same `ManualPayload` shape as the existing local Route Handler. Validates the `serviceId` exists in the `services` container for this `clientId`. Writes to `reservations` container. Returns `{ ok: true, id }`.

#### `PATCH /admin/reservations/:id`

Validates JWT. Accepts `{ status: 'confirmed' | 'cancelled' | 'no-show' }`. Updates the document in `reservations` container. Returns 404 if not found or `clientId` does not match. Returns `{ ok: true }`.

### Services

#### `GET /admin/services`

Validates JWT. Returns all services for `jwt.clientId` from `services` container.

#### `PUT /admin/services`

Validates JWT. Accepts the full services array. Replaces (upserts) the services document for `jwt.clientId`. Returns `{ ok: true }`.

### Schedule

#### `GET /admin/schedule`

Validates JWT. Returns the schedule document for `jwt.clientId` from `schedule` container.

#### `PUT /admin/schedule`

Validates JWT. Replaces the schedule document. Returns `{ ok: true }`.

#### `POST /admin/schedule`

Validates JWT. Adds a new schedule slot/rule. Returns `{ ok: true, id }`.

#### `DELETE /admin/schedule`

Validates JWT. Accepts `{ id: string }` in body. Deletes the matching slot/rule. Returns 404 if not found or `clientId` does not match. Returns `{ ok: true }`.

### Company profile

#### `GET /admin/company-profile`

Validates JWT (or `Authorization: Bearer <COMPANY_PROFILE_BUILD_TOKEN>` with `?clientId=` for build-time reads). Returns `{ profile: CompanyProfile | null }` from the `client-profile` container.

#### `PUT /admin/company-profile`

Validates JWT. Accepts `{ profile: CompanyProfile }`, validates shape, upserts to `client-profile` container. Returns `{ ok: true }`.

---

## Shared utilities to implement

| File | Purpose |
|---|---|
| `azure-functions/src/auth/validateAdminJwt.ts` | Parse + verify `admin-session` cookie; return `{ email, clientId }` or throw `HttpError(401)` |
| `azure-functions/src/auth/signAdminJwt.ts` | Sign a JWT with `ADMIN_JWT_SECRET` and return the signed string |
| `azure-functions/src/auth/setCookie.ts` | Build `Set-Cookie` header string for the `admin-session` cookie |
| `azure-functions/src/cosmos/adminDb.ts` | Typed Cosmos DB client helpers: `getAdminUser`, `getServices`, `getReservations`, etc. |
| `azure-functions/src/errors/HttpError.ts` | `class HttpError extends Error { constructor(status, message) }` for unified error handling |

---

## Requirements

- [ ] All 10 endpoints implemented and callable from the admin SPA
- [ ] JWT validation is performed in every protected endpoint; 401 is returned for missing, expired, or tampered tokens
- [ ] `clientId` is always sourced from the JWT, never from URL params or body for data scoping
- [ ] A `GET /clients/:clientId/config` request with a mismatched `clientId` in the JWT returns 403
- [ ] Local dev: `local.settings.json` includes `ADMIN_JWT_SECRET`, `COSMOS_DB_ENDPOINT`, `COSMOS_DB_KEY`
- [ ] All endpoints return `Content-Type: application/json`
- [ ] CORS headers allow the admin SPA domain (see `configure-admin-deploy-pipeline` task for the exact origin)
- [ ] `npm run build` inside `azure-functions/` exits 0
- [ ] At least the `auth/login` and `auth/me` endpoints have unit tests under `azure-functions/src/__tests__/`

---

## Files touched

| Area | Paths |
|---|---|
| Auth functions | `azure-functions/src/functions/auth/login.ts`, `logout.ts`, `me.ts` |
| Client config | `azure-functions/src/functions/clients/config.ts` |
| Reservations | `azure-functions/src/functions/admin/reservations.ts`, `reservationById.ts` |
| Services | `azure-functions/src/functions/admin/services.ts` |
| Schedule | `azure-functions/src/functions/admin/schedule.ts` |
| Shared utilities | `azure-functions/src/auth/`, `azure-functions/src/cosmos/adminDb.ts`, `azure-functions/src/errors/HttpError.ts` |
| Config | `azure-functions/local.settings.json.example` — add new env vars |
| Docs | `azure-functions/README.md` — document all endpoints, auth model, local dev setup |

---

## Local dev testing

```bash
cd azure-functions
func start

# Login
curl -X POST http://localhost:7071/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"secret","clientId":"1"}'

# Check session
curl -b "admin-session=<token>" http://localhost:7071/auth/me

# Get reservations
curl -b "admin-session=<token>" \
  "http://localhost:7071/admin/reservations?startDate=2026-01-01&endDate=2026-12-31"
```

---

## Acceptance criteria

1. `POST /auth/login` with valid credentials returns `{ ok: true, email, clientId }` and sets the `admin-session` cookie
2. `POST /auth/login` with wrong password returns 401
3. `GET /auth/me` with a valid cookie returns `{ email, clientId }`
4. `GET /auth/me` with no cookie or an expired token returns 401
5. `GET /admin/reservations` returns only reservations for the JWT's `clientId` — never another client's
6. `GET /clients/other-client/config` with a JWT for `clientId = "1"` returns 403
7. All endpoints return 401 when the `admin-session` cookie is absent
8. `npm run build` inside `azure-functions/` exits 0
