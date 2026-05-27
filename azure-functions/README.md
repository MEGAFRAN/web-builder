# Reservation & Admin API — Azure Function App

Node.js/TypeScript Azure Functions v4 that power the public booking widget and the admin SPA for all web-builder clients.

## Endpoints

### Public booking

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/booking-services?clientId=` | Return the bookable services catalog for a client |
| GET | `/booking-settings?clientId=` | Return tenant no-show policy (`bookingSettings`) |
| POST | `/reservations` | Create a reservation |
| GET | `/availability?clientId=&date=YYYY-MM-DD` | Return booked time slots for a date |

### Admin auth

All admin endpoints (except login/logout) require an `httpOnly` JWT cookie named `admin-session`. The cookie is issued by `POST /auth/login` and cleared by `POST /auth/logout`.

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/auth/login` | Authenticate; sets session cookie |
| POST | `/auth/logout` | Clears session cookie |
| GET | `/auth/me` | Returns `{ email, clientId }` for the current session |

### Admin data

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/clients/{clientId}/config` | Client shell header config (`displayName`, `logoUrl`); 403 if JWT clientId mismatch |
| GET | `/admin/reservations?startDate=&endDate=` | List reservations for the session client |
| POST | `/admin/reservations` | Create a manual reservation |
| PATCH | `/admin/reservations/{id}` | Cancel or mark no-show (`{ action, reason? }`) |
| GET | `/admin/services` | List services for the session client |
| PUT | `/admin/services` | Replace services catalogue |
| GET | `/admin/schedule` | Get weekly hours + exceptions |
| PUT | `/admin/schedule` | Replace weekly hours |
| POST | `/admin/schedule` | Add a schedule exception |
| DELETE | `/admin/schedule?id=` | Delete a schedule exception |
| GET | `/admin/company-profile` | Get company profile (JWT or build token) |
| PUT | `/admin/company-profile` | Upsert company profile |
| GET | `/mgmt/stripe-connect` | Stripe Connect status for the session client |
| POST | `/mgmt/stripe-connect` | Create or resume Stripe Connect Standard onboarding |
| GET | `/setup-intent?clientId=&email=` | Create SetupIntent on connected account (card-on-file) |
| GET | `/mgmt/booking-settings` | Tenant `bookingSettings` from Cosmos (`{clientId}-settings`) |
| POST | `/mgmt/charge-noshow` | Charge no-show fee (`{ reservationId }`) |

## Auth model

- JWTs are signed with `HS256` and stored in the `admin-session` cookie (7-day TTL).
- Production cookies use `SameSite=None; Secure` so the admin SPA (Static Web Apps) can send the session on cross-origin requests to this Function App. Detected automatically when `WEBSITE_SITE_NAME` is set (Azure) or `NODE_ENV=production`. Override with `ADMIN_COOKIE_CROSS_SITE=true|false`. Local dev uses `SameSite=Lax` without `Secure`.
- `clientId` is always read from the validated JWT — never from query params or request body for data scoping.
- Signing key: `ADMIN_JWT_SECRET` (min 32 characters).

## Environment variables

Set these in Azure Portal → Function App → Configuration, or copy `local.settings.json.example` to `local.settings.json` for local dev.

| Variable | Required | Description |
|----------|----------|-------------|
| `ADMIN_JWT_SECRET` | Yes (admin) | HS256 signing key for admin JWT cookies |
| `COSMOS_ENDPOINT` | Yes | Azure Cosmos DB account endpoint URL |
| `COSMOS_KEY` | Yes | Cosmos DB primary key |
| `COSMOS_ADMIN_DATABASE` | No | Admin database name (default: `web-builder-admin`) |
| `COSMOS_CLIENT_PROFILE_CONTAINER` | No | Company profile container (default: `client-profile`) |
| `COMPANY_PROFILE_BUILD_TOKEN` | No | Bearer token for build-time profile reads |
| `NOTIFICATION_EMAIL_FROM` | No | Sender address for confirmation emails |
| `SENDGRID_API_KEY` | No | SendGrid API key — emails are skipped if absent |
| `STRIPE_SECRET_KEY` | No | Stripe secret key for Connect onboarding (`POST /mgmt/stripe-connect`) |
| `ADMIN_STRIPE_RETURN_URL` | No | Return URL after Stripe onboarding (defaults to request `Origin` + `/admin/settings/`) |
| `STRIPE_PUBLISHABLE_KEY` | No | Publishable key returned to the browser for SetupIntent (Functions) |

Seed tenant booking settings for charge-no-show: `CLIENT_ID=test node scripts/seed-tenant-booking-settings.mjs` (requires Cosmos env vars). Client deploy workflows also run this automatically when `COSMOS_ENDPOINT` and `COSMOS_KEY` GitHub secrets are set.

At runtime, `GET /mgmt/booking-settings` and `GET /booking-settings` call `resolveTenantBookingSettings`, which backfills Cosmos from `client.json` defaults when a tenant already has card-on-file reservations but no `{clientId}-settings` document. New guaranteed bookings call `ensureTenantBookingSettings` on create.

## Cosmos DB setup

Create database `web-builder-admin` with these containers (partition key `/clientId` on all):

| Container | Purpose |
|-----------|---------|
| `admin-users` | Admin credentials + shell config (`displayName`, `logoUrl`) |
| `reservations` | Client booking records |
| `services` | One document per client (`{ id, clientId, services[] }`) |
| `schedule` | One document per client (`{ id, clientId, weekly, exceptions }`) |
| `client-profile` | Company profile + Stripe account id (`{clientId}-profile`, `{clientId}-stripe`) |

All public booking endpoints (`/availability`, `/reservations`, `/booking-services`) read and write the **`reservations`** container in this database.

Seed the first admin user with `node scripts/seed-admin-user.mjs` (see repo root).

## CORS (required for cross-origin booking)

Client static sites (Azure blob / SWA) call this Function App from the browser on a **different origin**. `GET` requests work without a preflight, but `POST /reservations` triggers an **OPTIONS preflight**.

Azure may intercept OPTIONS at the **platform layer** before your function runs. If the Function App **CORS** blade has a restricted allow-list, only those origins receive preflight headers — other client sites fail with a browser CORS error even though the function code reflects `Origin` correctly on `POST`.

**Recommended for multi-tenant (100+ client sites):**

- **Public booking:** the static widget posts reservations with `Content-Type: text/plain` (JSON body) to avoid OPTIONS preflight, so client blob origins do not need to be listed here.
- **Admin SPA:** cross-origin admin calls use `Authorization` and `credentials: 'include'`, which always preflight. Either:
  1. Add the admin SWA origin (e.g. `https://<admin-swa>.azurestaticapps.net`) to Allowed Origins and enable credentials, **or**
  2. Remove all Allowed Origins so function code handles preflight for every origin.

**Do not** rely on `https://portal.azure.com` — remove it; it is not your app.

Keep `http://localhost:3000` only if local dev calls the deployed Function App.

Local dev: `local.settings.json.example` sets `"Host": { "CORS": "*" }` so Core Tools behaves like an open CORS policy.

Verify preflight after changes:

```bash
curl -i -X OPTIONS "https://<app>.azurewebsites.net/api/reservations" \
  -H "Origin: https://<client-static-site>" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type"
```

Expect `Access-Control-Allow-Origin: https://<client-static-site>` in the response.

## Local development

```bash
cd azure-functions
cp local.settings.json.example local.settings.json   # fill in Cosmos + secret values
npm install
npm run build
npm start   # requires Azure Functions Core Tools v4
```

### Smoke test

```bash
# Login
curl -X POST http://localhost:7071/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"secret","clientId":"1"}'

# Check session (use cookie value from Set-Cookie header)
curl -b "admin-session=<token>" http://localhost:7071/auth/me

# Get reservations
curl -b "admin-session=<token>" \
  "http://localhost:7071/admin/reservations?startDate=2026-01-01&endDate=2026-12-31"
```

### Tests

**In this package** (`node:test` — auth and HTTP helpers):

```bash
npm test
```

**Vitest** (Cosmos store + reservation handler mocks) lives in root `__tests__/azure/`. Run from the repo root:

```bash
npm run test -- __tests__/azure/
```

## Connecting a client

In `config/clients/{clientId}/client.json`:

```json
{
  "features": { "booking": true },
  "reservationEndpoint": "https://<function-app>.azurewebsites.net/api/reservations",
  "bookingServicesEndpoint": "https://<function-app>.azurewebsites.net/api/booking-services"
}
```

For the admin SPA, set `NEXT_PUBLIC_ADMIN_API_URL` to the Function App base URL in the deployed environment.

For client site blob builds, set the repository variable `ADMIN_API_URL` to the same Function App base URL (including `/api` if that is your Functions route prefix). The deploy workflow bakes it into the static bundle as `NEXT_PUBLIC_BOOKING_API_URL` and uses it for build-time company profile reads. Add GitHub secret `COMPANY_PROFILE_BUILD_TOKEN` matching the Function App setting of the same name.

Then add a page using the `reservationBlock` type (or inherit from `restaurant-standard` template which includes `/reservas`).
