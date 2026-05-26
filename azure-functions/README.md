# Reservation & Admin API — Azure Function App

Node.js/TypeScript Azure Functions v4 that power the public booking widget and the admin SPA for all web-builder clients.

## Endpoints

### Public booking

| Method | Route | Description |
|--------|-------|-------------|
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

## Auth model

- JWTs are signed with `HS256` and stored in the `admin-session` cookie (7-day TTL).
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
| `COSMOS_DATABASE` | No | Public bookings database (default: `reservations`) |
| `COSMOS_CONTAINER` | No | Public bookings container (default: `bookings`) |
| `COSMOS_CLIENT_PROFILE_CONTAINER` | No | Company profile container (default: `client-profile`) |
| `COMPANY_PROFILE_BUILD_TOKEN` | No | Bearer token for build-time profile reads |
| `NOTIFICATION_EMAIL_FROM` | No | Sender address for confirmation emails |
| `SENDGRID_API_KEY` | No | SendGrid API key — emails are skipped if absent |

## Cosmos DB setup

Create database `web-builder-admin` with these containers (partition key `/clientId` on all):

| Container | Purpose |
|-----------|---------|
| `admin-users` | Admin credentials + shell config (`displayName`, `logoUrl`) |
| `reservations` | Client booking records |
| `services` | One document per client (`{ id, clientId, services[] }`) |
| `schedule` | One document per client (`{ id, clientId, weekly, exceptions }`) |
| `client-profile` | Company profile for SSG |

Public booking uses a separate database (default `reservations`) with container `bookings`.

Seed the first admin user with `node scripts/seed-admin-user.mjs` (see repo root).

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

```bash
npm test
```

## Connecting a client

In `config/clients/{clientId}/client.json`:

```json
{
  "features": { "booking": true },
  "reservationEndpoint": "https://<function-app>.azurewebsites.net/api/reservations"
}
```

For the admin SPA, set `NEXT_PUBLIC_ADMIN_API_URL` to the Function App base URL in the deployed environment.

Then add a page using the `reservationBlock` type (or inherit from `restaurant-standard` template which includes `/reservas`).
