# Web Builder

Multi-tenant Next.js SSG platform: one codebase builds isolated static sites for 100+ clients. Each client is defined by JSON config under `config/clients/{clientId}/` and deployed independently to Azure.

For architecture details see [`architecture.md`](architecture.md). For booking and admin APIs see [`azure-functions/README.md`](azure-functions/README.md).

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 24.x (CI) / 22+ | Match `.github/workflows` |
| npm | 10+ | Use `npm ci` in CI |
| Azure Functions Core Tools | v4 | Only when running `azure-functions/` locally |
| Azure CLI | latest | Only for manual blob deploys / debugging |

```bash
git clone <repo-url>
cd web-builder
npm install
```

---

## Run a client locally

Each client lives under `config/clients/{clientId}/`. The dev server loads **exactly one** client per run via `CLIENT_ID`.

```bash
# Option A — pass clientId as an argument
npm run dev -- demo-phone-repair-shop

# Option B — npm config alias
npm run dev --site=demo-phone-repair-shop

# Option C — environment variable
CLIENT_ID=demo-phone-repair-shop npm run dev
```

Open [http://localhost:3000](http://localhost:3000). List available clients:

```bash
ls config/clients/
```

This repo includes demo clients such as `demo-phone-repair-shop`, `restaurante-pepe`, and `test`.

To expose the dev server on your LAN (phone / tablet testing):

```bash
npm run dev:host -- demo-phone-repair-shop
```

Pages are derived from the client's config (and template, if declared). For `demo-phone-repair-shop`: `/` (home), `/servicios`, `/contacto`.

### Optional `.env.local`

Create `.env.local` at the repo root for admin login and optional remote API overrides:

```bash
CLIENT_ID=demo-phone-repair-shop
ADMIN_JWT_SECRET=local-dev-secret-at-least-32-characters-long
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-local-password
```

| Variable | Required | Purpose |
|----------|----------|---------|
| `CLIENT_ID` | Yes | Selects `config/clients/{clientId}/client.json` |
| `ADMIN_JWT_SECRET` | For `/admin` | HS256 signing key (min 32 chars) |
| `ADMIN_EMAIL` | For `/admin` | Local admin login email |
| `ADMIN_PASSWORD` | For `/admin` | Local admin login password |
| `NEXT_PUBLIC_ADMIN_API_URL` | No | Point admin at deployed Functions instead of local route handlers |
| `NEXT_PUBLIC_BOOKING_API_URL` | No | Point booking widget at deployed Functions instead of local `/api/*` |

Without the `NEXT_PUBLIC_*_API_URL` vars, booking and admin use **local Next.js route handlers** and JSON files under `data/`.

### Admin portal (local)

With the dev server running and admin env vars set:

1. Visit [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
2. Sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` and `clientId` `demo-phone-repair-shop` (or whichever client you started dev with)

### Build a client site locally

Simulates the production blob export (excludes `app/api/` and `app/admin/`):

```bash
CLIENT_ID=demo-phone-repair-shop npm run build:blob
npx serve out   # preview static output
```

### Azure Functions (optional)

For Cosmos DB, Stripe Connect, or production API parity, run the Function App locally. Full setup: [`azure-functions/README.md`](azure-functions/README.md).

```bash
cd azure-functions
cp local.settings.json.example local.settings.json
npm install && npm run build && npm start   # http://localhost:7071
```

Then add to repo-root `.env.local`:

```bash
NEXT_PUBLIC_ADMIN_API_URL=http://localhost:7071
NEXT_PUBLIC_BOOKING_API_URL=http://localhost:7071
```

Restart `npm run dev -- demo-phone-repair-shop`.

---

## Deploy client sites via GitHub Actions

Client deploys are **manual** — one workflow run per client. In GitHub go to **Actions**, pick the workflow, click **Run workflow**, and enter the `clientId` (must match a folder under `config/clients/`).

### Primary: Blob Storage — `Deploy Website to Blob Storage`

Workflow: [`.github/workflows/deploy-blob-storage.yml`](.github/workflows/deploy-blob-storage.yml)

1. Builds with `npm run build:blob` and `CLIENT_ID={input}`
2. Discovers the Azure Storage account by tag (`client_id` or `team_id` = `clientId`)
3. Syncs `./out` to the `$web` container

**Repository variables** (Settings → Secrets and variables → Actions → Variables):

| Variable | Example | Purpose |
|----------|---------|---------|
| `ADMIN_API_URL` | `https://<app>.azurewebsites.net/api` | Baked as `NEXT_PUBLIC_BOOKING_API_URL`; build-time company profile fetch |

**Repository secrets** (Settings → Secrets and variables → Actions → Secrets):

| Secret | Purpose |
|--------|---------|
| `COMPANY_PROFILE_BUILD_TOKEN` | Bearer token for build-time company profile (must match Function App setting) |
| `AZURE_CLIENT_ID` | OIDC service principal for blob sync |
| `AZURE_TENANT_ID` | Azure AD tenant |
| `AZURE_SUBSCRIPTION_ID` | Azure subscription |
| `COSMOS_ENDPOINT` | Optional — seeds tenant booking settings after deploy |
| `COSMOS_KEY` | Optional — pairs with `COSMOS_ENDPOINT` |

**Azure setup:** tag the client's Storage account with `client_id=demo-phone-repair-shop` (or `team_id`; must match the `clientId` you deploy).

### Legacy: Static Web Apps — `Deploy Client`

Workflow: [`.github/workflows/deploy-swa.yml`](.github/workflows/deploy-swa.yml)

Same build as blob deploy, uploads to Azure Static Web Apps. Requires a **per-client** deploy token:

| Secret | Naming |
|--------|--------|
| `SWA_TOKEN_{CLIENT_KEY}` | Hyphens → underscores (e.g. `demo-phone-repair-shop` → `SWA_TOKEN_demo_phone_repair_shop`) |

Uses the same `ADMIN_API_URL` variable and `COMPANY_PROFILE_BUILD_TOKEN` secret as the blob workflow.

### Admin SPA — `Deploy Admin SPA`

Workflow: [`.github/workflows/deploy-admin-swa.yml`](.github/workflows/deploy-admin-swa.yml)

Single shared admin deployment for all tenants (manual dispatch).

| Variable / Secret | Purpose |
|-------------------|---------|
| `ADMIN_API_URL` (variable) | Baked as `NEXT_PUBLIC_ADMIN_API_URL` |
| `ADMIN_BUILD_CLIENT_ID` (variable) | Any valid `clientId` for root layout CSS at build time (default: `1`) |
| `SWA_TOKEN_ADMIN` (secret) | SWA deployment token for the admin instance |

### Typical deploy flow

```
1. Merge client config changes to main
2. Actions → "Deploy Website to Blob Storage" → Run workflow → clientId: demo-phone-repair-shop
3. (Optional) Actions → "Deploy Admin SPA" if admin UI changed
4. Verify client site URL and /admin login against production Functions
```

---

## Tests & validation

```bash
npm test                  # run all tests once
npm run test:watch        # watch mode
npm run validate:quick    # catalog generation, lint, tests, typecheck
```

Azure Functions tests: see [`azure-functions/README.md`](azure-functions/README.md).

---

## Adding a new client

1. Create `config/clients/{clientId}/client.json` (and optional `pages/` overrides). Use [`demo-phone-repair-shop`](config/clients/demo-phone-repair-shop/) or a [template](config/templates/) as reference.
2. Preview locally: `npm run dev -- demo-phone-repair-shop`
3. Verify build: `CLIENT_ID=demo-phone-repair-shop npm run build:blob`
4. Tag the Azure Storage account with `client_id={clientId}` and run the blob deploy workflow.

If the client uses booking, configure endpoints in `client.json` — see [`azure-functions/README.md`](azure-functions/README.md#connecting-a-client).
