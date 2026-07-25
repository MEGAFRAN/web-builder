# Task: Deploy Generic Demo Site (T-D)

**Status:** Done — completed July 26, 2026
**Priority:** High — required to share one demo URL in WhatsApp outreach
**Owner:** devops
**Estimated scope:** Small — 1 hour (+ founder custom-domain setup)
**Depends on:** T-A (`29-template-surgery-repair-shop.md`), T-B (`30-static-priced-services-block.md`), T-C (`25-fix-deploy-blob-workflow.md`)
**Milestone:** M0 (Week 1)
**Source:** `docs/meetings/summaries/2026-07-24-pivot-mobile-repair-shops-spain.md`

---

## Context

Acquisition uses **one generic demo site per vertical**, not a personalized site per lead.

- **Demo client:** `config/clients/demo-phone-repair-shop/` (fictional mobile shop, Spanish copy, static prices — repairs + accessories).
- **Demo hosting:** **Azure Static Web Apps (SWA)** — same platform as `clubtal.com` and `cert.clubtal.com`. Deploy via **`.github/workflows/deploy-demo-swa.yml`** (GitHub Actions manual dispatch).
- **M0 customer-facing URL:** **`https://moviles.clubtal.com`** — semantic vertical subdomain on the mobile-shop demo SWA. Broad enough for repair shops, hybrid shops, and accessory retailers. Do **not** send raw `.azurestaticapps.net` hostnames in cold WhatsApp DMs.
- **Subdomain naming strategy (locked):** one **semantic vertical subdomain per SWA** — immutable links that never break when outreach shifts to a new vertical. Do **not** reuse a single floating subdomain (e.g. redeploying `demo.clubtal.com` when switching verticals).
- **Future verticals:** one SWA resource per template with its own semantic subdomain (e.g. `restaurante.clubtal.com`, `clinica.clubtal.com`). Stay within the 10 free SWA cap per subscription.
- **Paying client sites stay on blob storage** — Clubtal-owned surfaces (marketing, cert, vertical demos) use SWA; client custom domains use Azure Blob `$web` + Cloudflare.

**Why `moviles` not `reparacion`:** not all mobile stores repair phones — some sell accessories only. `moviles.clubtal.com` fits repair, hybrid, and accessory shops. Alternative if preferred: `telefonia.clubtal.com`.

Personalise the *WhatsApp message* with the prospect's business name and city — not the *site* with their scraped data.

Sample first message (after WhatsApp warm-up):

> "Hola [Nombre], soy de Clubtal — hacemos webs profesionales para tiendas de móviles. Aquí tenéis un ejemplo: **https://moviles.clubtal.com** — Si os interesa algo así para [Nombre de tienda], por 39€/mes + IVA (deducible). Sin compromiso."

The scraper CSV is used only for **lead selection and outreach** (phone, name, city, review filter). It is **not** used to generate per-lead websites. Prioritize repair-first and hybrid shops in scraper queries (`reparación de móviles`, `servicio técnico móviles`); accessory-only shops convert slower but the demo URL still fits.

---

## Technical Specifications

### Build (root — no basePath)

```bash
CLIENT_ID=demo-phone-repair-shop npm run build:blob
```

Output goes to `out/` — same static export as paying client blob builds. Use locally to verify before deploying; **GitHub Actions performs the build in CI**.

### GitHub Actions workflow (canonical deploy path)

Use **`.github/workflows/deploy-demo-swa.yml`**:

- Manual dispatch → **Actions → Deploy Demo Site → Run workflow**
- Hardcoded `CLIENT_ID: demo-phone-repair-shop`
- Requires GitHub secret with the demo SWA deployment token (see Azure Portal → SWA → Manage deployment token)
- Builds with `npm run build:blob` (minimal env when `features.booking` is `false`), uploads prebuilt `out/` to the mobile-shop demo SWA resource

The demo client has `"booking": false` — no Cosmos or Azure Functions secrets required for the build.

There is **no** local `npm run deploy:demo` script. CI is the single publish path.

### Azure SWA resource (M0 — mobile shop vertical)

For M0 (mobile repair / telefonía shops):

- Create one SWA resource (e.g. `clubtal-demo-moviles`) in the same resource group as other Clubtal SWAs.
- Note the default hostname: `https://{name}.azurestaticapps.net/`.
- Copy deployment token → GitHub Actions secret for the demo SWA.
- When adding a new vertical later, create a **separate** SWA resource with its own semantic subdomain — do not mix verticals in one SWA or overwrite an existing vertical's subdomain.

### Custom domain (founder — required for outreach)

1. In Azure Portal → mobile-shop demo SWA → **Custom domains** → add `moviles.clubtal.com`.
2. Follow Azure's DNS validation (CNAME `moviles` → `{swa-name}.azurestaticapps.net`).
3. SWA provides free managed SSL for the custom domain — no Cloudflare proxy required for HTTPS.
4. Document `https://moviles.clubtal.com` as the **canonical M0 demo link** for WhatsApp — not the raw `.azurestaticapps.net` URL.

Raw SWA hostname remains valid for engineering verification; custom domain is the customer-facing link.

**Optional:** `demo.clubtal.com` may 301-redirect to `moviles.clubtal.com` — not required for M0 outreach.

### Lead filter (outreach only)

≥20 Google reviews AND ≥4.0 rating — apply in the scraper or a Google Sheet filter when queueing WhatsApp DMs. **Not** part of this deploy task.

---

## Requirements

- [x] Document demo architecture in `docs/infrastructure/demo-swa.md`: one SWA + semantic subdomain per vertical, distinction from client blob hosting, GitHub Actions as canonical deploy path.
- [x] Provision Azure SWA resource for mobile-shop demo vertical.
- [x] Set GitHub secret with demo SWA deployment token.
- [x] **Founder:** add `moviles.clubtal.com` custom domain on demo SWA (document steps in `demo-swa.md`).
- [x] Verify demo loads at SWA default hostname **and** at `moviles.clubtal.com` (after DNS propagates).
- [x] Homepage shows priced services and WhatsApp/phone CTAs (not blank sections).
- [x] Re-running **Deploy Demo Site** workflow is idempotent.

---

## Files touched

| Area | Paths |
|---|---|
| CI workflow | `.github/workflows/deploy-demo-swa.yml` |
| Infrastructure docs | `docs/infrastructure/demo-swa.md` |

---

## Out of scope

- Local deploy script (`scripts/deploy-demo.mjs`, `npm run deploy:demo`) — CI is canonical.
- Per-lead demo generation from CSV (`generate-demos.mjs` — **cancelled**).
- Sub-path / `basePath` hosting.
- Paying client custom domains (Task T-E / `32-provision-client-script.md`) — those stay on blob storage.
- Automating Azure custom-domain DNS in the deploy workflow (manual for M0).
- Floating single subdomain that gets redeployed when switching verticals.

---

## Acceptance criteria

1. **Actions → Deploy Demo Site** builds and deploys `demo-phone-repair-shop` to SWA successfully.
2. Demo is accessible at the SWA default hostname (engineering URL).
3. Demo is accessible at `https://moviles.clubtal.com` (customer-facing URL for WhatsApp).
4. Homepage shows visible priced services and working WhatsApp/phone CTAs.
5. Demo uses **fictional** business data only — no scraped prospect identity.
6. Re-running the workflow succeeds without duplicate or broken uploads.
