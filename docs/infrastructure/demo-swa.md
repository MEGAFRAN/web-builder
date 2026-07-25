# Demo site hosting (Azure Static Web Apps)

Clubtal-owned **vertical demo sites** deploy to **Azure Static Web Apps (SWA)** — the same platform as `clubtal.com` and `cert.clubtal.com`. **Paying client sites** stay on Azure Blob Storage + Cloudflare.

## Strategy

- **One SWA resource per vertical** — e.g. mobile shops, restaurants, clinics.
- **One semantic subdomain per SWA** — immutable outreach URLs that never break when you switch verticals.
- **Do not** reuse a single floating subdomain (e.g. overwriting `demo.clubtal.com` when pivoting outreach).
- **Do not** send raw `.azurestaticapps.net` hostnames in cold WhatsApp DMs.

| Vertical | Customer URL | Client config |
|---|---|---|
| Mobile shops (M0) | `https://moviles.clubtal.com` | `config/clients/demo-phone-repair-shop/` |
| Restaurants (future) | `restaurante.clubtal.com` | separate SWA + client |
| Clinics (future) | `clinica.clubtal.com` | separate SWA + client |

Stay within the **10 free SWA cap** per Azure subscription.

## Hosting split

| Surface | Platform | Example |
|---|---|---|
| Clubtal marketing | SWA | `clubtal.com` |
| Cert / internal | SWA | `cert.clubtal.com` |
| Vertical demos (M0+) | SWA — one resource per vertical | `moviles.clubtal.com` |
| Paying client sites | Azure Blob `$web` + Cloudflare CNAME | client-owned domain |

Do **not** host vertical demos on blob storage or use Cloudflare CNAME → blob for demo outreach URLs. Do **not** reuse a single floating subdomain (e.g. `demo.clubtal.com`) redeployed per vertical.

## Canonical deploy path

Deploy via **GitHub Actions** — no local deploy script.

1. Merge demo config changes to `main`.
2. GitHub → **Actions** → **Deploy Demo Site** → **Run workflow**.
3. Workflow file: [`.github/workflows/deploy-demo-swa.yml`](../../.github/workflows/deploy-demo-swa.yml)

The workflow:

- Builds `demo-phone-repair-shop` with `npm run build:blob` (minimal env — `features.booking` is `false`, so no Cosmos or Azure Functions secrets).
- Uploads prebuilt `out/` to the demo SWA via `Azure/static-web-apps-deploy@v1`.

Re-running the workflow is idempotent.

### GitHub secret

The SWA deployment token is stored as a repository secret (name is set when the SWA resource is linked to GitHub — check **Settings → Secrets and variables → Actions**). The workflow references the secret configured for the mobile-shop demo SWA resource.

To rotate: Azure Portal → demo SWA → **Manage deployment token** → update the GitHub secret.

## Local build (verify only)

Preview and validate before deploying:

```bash
npm run dev -- demo-phone-repair-shop
CLIENT_ID=demo-phone-repair-shop npm run build:blob
npm run validate:client demo-phone-repair-shop
```

Local builds do **not** upload to SWA. Use the GitHub Actions workflow to publish.

## Custom domain (founder — manual)

Customer-facing M0 URL: **`https://moviles.clubtal.com`**

1. Azure Portal → mobile-shop demo SWA → **Custom domains** → add `moviles.clubtal.com`.
2. Choose **Custom domain on other DNS** (unless `clubtal.com` is hosted in Azure DNS).
3. Add DNS validation record — typically CNAME `moviles` → `{swa-name}.azurestaticapps.net`.
4. SWA provisions managed SSL automatically — Cloudflare proxy is not required for HTTPS.
5. Raw SWA hostname remains valid for engineering checks; use `moviles.clubtal.com` in outreach.

**Optional:** `demo.clubtal.com` may 301-redirect to `moviles.clubtal.com` — not required for M0.

## Acceptance checklist

- [ ] Actions → **Deploy Demo Site** completes successfully.
- [ ] Demo loads at SWA default hostname.
- [ ] Demo loads at `https://moviles.clubtal.com`.
- [ ] Homepage shows priced services and WhatsApp/phone CTAs.
- [ ] Demo uses fictional business data only (no scraped prospect identity).

## Related workflows

| Workflow | Purpose |
|---|---|
| [`deploy-demo-swa.yml`](../../.github/workflows/deploy-demo-swa.yml) | **Demo vertical sites** (canonical for M0) |
| [`deploy-swa.yml`](../../.github/workflows/deploy-swa.yml) | Generic per-client SWA deploy (manual `clientId` input) |
| [`deploy-blob-storage.yml`](../../.github/workflows/deploy-blob-storage.yml) | **Paying client** static sites on blob storage |
