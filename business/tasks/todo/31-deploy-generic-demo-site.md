# Task: Deploy Generic Demo Site (T-D)

**Status:** Ready for development
**Priority:** High — required to share one demo URL in WhatsApp outreach
**Owner:** devops
**Estimated scope:** Small — 1 hour (+ founder vanity domain setup)
**Depends on:** T-A (`29-template-surgery-repair-shop.md`), T-B (`30-static-priced-services-block.md`), T-C (`25-fix-deploy-blob-workflow.md`)
**Milestone:** M0 (Week 1)
**Source:** `docs/meetings/summaries/2026-07-24-pivot-mobile-repair-shops-spain.md`

---

## Context

Acquisition uses **one generic demo site**, not a personalized site per lead.

- **Demo client:** `config/clients/demo-phone-repair-shop/` (fictional repair shop, Spanish copy, static prices).
- **Demo hosting:** one **Azure Storage account** for the repair-shop vertical, static website enabled on `$web`, deployed at the **blob endpoint root** (e.g. `https://webrepairdemo.z43.web.core.windows.net/`).
- **WhatsApp URL:** do **not** send the raw `.web.core.windows.net` link in cold DMs — it looks like phishing. Use **`https://demo.clubtal.com`** (founder-owned domain) with Cloudflare free tier: CNAME → Azure blob static website endpoint.
- **Future verticals:** one storage account per demo template (restaurants, bars, gyms, video game stores, etc.). Point subdomain CNAMEs at whichever vertical's blob endpoint is active (e.g. `repair.clubtal.com`, `restaurant.clubtal.com`).

Personalise the *WhatsApp message* with the prospect's business name and city — not the *site* with their scraped data.

Sample first message (after WhatsApp warm-up):

> "Hola [Nombre], soy de Clubtal — hacemos webs profesionales para tiendas de reparación de móviles. Aquí tenéis un ejemplo: **https://demo.clubtal.com** — Si os interesa algo así para [Nombre de tienda], por 39€/mes + IVA (deducible). Sin compromiso."

The scraper CSV is used only for **lead selection and outreach** (phone, name, city, review filter). It is **not** used to generate per-lead websites.

---

## Technical Specifications

### Build (root — no basePath)

```bash
CLIENT_ID=demo-phone-repair-shop npm run build:blob
```

Upload `out/` to the repair-vertical storage account's `$web` container.

### Azure Storage (one account per vertical)

For M0 (mobile repair shops):

- Create one storage account (e.g. `webrepairdemo`) with static website hosting on `$web`.
- Note the primary web endpoint: `https://{account}.z43.web.core.windows.net/`.
- When adding a new vertical later, create a **separate** storage account for that template — do not mix verticals in one bucket.

### Vanity domain (founder — required for outreach)

1. Add `clubtal.com` to Cloudflare (free tier) if not already configured.
2. CNAME `demo` → Azure blob static website endpoint for the repair-vertical storage account.
3. Enable Cloudflare proxy (orange cloud) for free SSL and CDN on `demo.clubtal.com`.
4. Document the vanity URL as the **canonical demo link** for WhatsApp — not the raw Azure URL.

Raw Azure URL remains valid for engineering verification; vanity domain is the customer-facing link.

### Upload script

Add `scripts/deploy-demo.mjs` (or `npm run deploy:demo`) that:

1. Runs `CLIENT_ID=demo-phone-repair-shop npm run build:blob` (no `BASE_PATH`).
2. Syncs `out/` to the repair-vertical `$web` container via `az storage blob sync`.
3. Prints both URLs: raw blob endpoint + vanity domain (from env or config).

```json
"deploy:demo": "node scripts/deploy-demo.mjs"
```

Environment variables (example):

- `AZURE_DEMO_STORAGE_ACCOUNT` — repair vertical account name
- `DEMO_VANITY_URL` — `https://demo.clubtal.com` (for script output only; DNS is manual)

### Lead filter (outreach only)

≥20 Google reviews AND ≥4.0 rating — apply in the scraper or a Google Sheet filter when queueing WhatsApp DMs. **Not** part of this deploy task.

---

## Requirements

- [ ] Document demo architecture in `docs/infrastructure/demo-storage.md`: one account per vertical, blob root hosting, vanity domain pattern.
- [ ] Provision Azure Storage account for repair-shop demo vertical.
- [ ] **Founder:** register vanity domain and configure Cloudflare CNAME → blob endpoint (document steps in `demo-storage.md`).
- [ ] Write `scripts/deploy-demo.mjs` that builds `demo-phone-repair-shop` and uploads `out/` to `$web`.
- [ ] Add `"deploy:demo": "node scripts/deploy-demo.mjs"` to `package.json`.
- [ ] Verify demo loads at blob endpoint root **and** at vanity domain (after DNS propagates).
- [ ] Homepage shows priced services and WhatsApp/phone CTAs (not blank sections).
- [ ] Re-running `deploy:demo` is idempotent.

---

## Files touched

| Area | Paths |
|---|---|
| New script | `scripts/deploy-demo.mjs` (new) |
| Package scripts | `package.json` (modified — add `deploy:demo`) |
| Infrastructure docs | `docs/infrastructure/demo-storage.md` (new) |

---

## Out of scope

- Per-lead demo generation from CSV (`generate-demos.mjs` — **cancelled**).
- Sub-path / `basePath` hosting.
- Paying client custom domains (Task T-E / `32-provision-client-script.md`).
- Automating Cloudflare DNS in the deploy script (manual for M0).

---

## Acceptance criteria

1. `npm run deploy:demo` builds and uploads `demo-phone-repair-shop` successfully.
2. Demo is accessible at the Azure blob endpoint root (engineering URL).
3. Demo is accessible at the vanity domain (customer-facing URL for WhatsApp).
4. Homepage shows visible priced services and working WhatsApp/phone CTAs.
5. Demo uses **fictional** business data only — no scraped prospect identity.
6. Re-running `deploy:demo` succeeds without duplicate or broken uploads.
