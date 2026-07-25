# Task 35 — Update Demo Domain Strategy (Semantic Vertical Subdomains)

**Execution order:** 3 of 3  
**Status:** Ready for development  
**Priority:** High — demo deploy task and infra docs must use owned domain + correct subdomain pattern  
**Owner:** devops  
**Estimated scope:** Small — 30–60 min  
**Depends on:** None (can run in parallel with Tasks 33–34; founder configures DNS)  
**Next task:** None  
**Milestone:** M0 (Week 1)  
**Source:** `docs/meetings/summaries/2026-07-25-company-name-debate.md`

---

## Context

Founder owns **`clubtal.com`**. Demo links in WhatsApp outreach use **semantic vertical subdomains** on Azure Static Web Apps — one SWA per vertical, one immutable URL per vertical.

**M0 demo URL (locked):** **`https://moviles.clubtal.com`**

**Why `moviles` not `reparacion` or `demo`:** not all mobile stores repair phones — many sell accessories only or are hybrid shops. `moviles.clubtal.com` fits the full M0 target market. Alternative: `telefonia.clubtal.com`.

**Hosting decision (July 25, 2026):** Clubtal-owned surfaces (`clubtal.com`, `cert.clubtal.com`, vertical demo subdomains) stay on SWA. Paying client sites use Azure Blob Storage.

**Subdomain strategy (locked):** semantic vertical subdomains (Strategy 1) — e.g. `moviles.clubtal.com`, `restaurante.clubtal.com`. Do **not** use abstract numbered subdomains (`web1.clubtal.com`) or a single floating subdomain redeployed per vertical (`demo.clubtal.com` overwritten when switching outreach).

Raw `.azurestaticapps.net` URLs must never appear in customer-facing outreach.

---

## Technical Specifications

### Files to update

| File | Change |
|---|---|
| `business/tasks/todo/31-deploy-generic-demo-site.md` | SWA hosting + `moviles.clubtal.com` (done in Task 31 spec) |
| `business/tasks/todo/34-clubtal-outreach-copy.md` | Demo URL → `https://moviles.clubtal.com` |
| `business/tasks/todo/28-cloudflare-analytics-beacon.md` | Vanity domain example → `moviles.clubtal.com` |
| `business/roadmap/2026-07-24-roadmap-to-first-10-paying-clients.md` | SWA + semantic subdomain strategy |
| `docs/meetings/summaries/2026-07-24-pivot-mobile-repair-shops-spain.md` | Amendment: M0 demo = `moviles.clubtal.com` on SWA |
| `docs/infrastructure/demo-swa.md` | Create or update with SWA custom-domain + vertical subdomain pattern |

### Custom domain pattern (founder — document steps, do not automate in M0)

1. Mobile-shop demo SWA resource exists (created in Task 31).
2. Azure Portal → demo SWA → **Custom domains** → add `moviles.clubtal.com`.
3. Add DNS record per Azure validation (CNAME `moviles` → `{swa-name}.azurestaticapps.net`).
4. SWA provisions managed SSL automatically — no Cloudflare proxy needed for HTTPS.
5. Set env var `DEMO_VANITY_URL=https://moviles.clubtal.com` for deploy script output.

### Future vertical pattern

| Vertical | Subdomain | SWA resource |
|---|---|---|
| Mobile shops (M0) | `moviles.clubtal.com` | `clubtal-demo-moviles` (example) |
| Restaurants (future) | `restaurante.clubtal.com` | separate SWA |
| Clinics (future) | `clinica.clubtal.com` | separate SWA |

Each vertical keeps its URL permanently — past WhatsApp DMs never break when outreach shifts.

### Deploy script

Ensure `scripts/deploy-demo.mjs` (when created in Task 31) prints `DEMO_VANITY_URL` defaulting to `https://moviles.clubtal.com`.

---

## Requirements

- [ ] Replace `demo.clubtal.com` and `tuwebdemo.es` references in tasks 28, 31, 34, and roadmap with `moviles.clubtal.com`.
- [ ] Document SWA custom-domain + semantic subdomain strategy in `docs/infrastructure/demo-swa.md`.
- [ ] Add amendment to July 24 pivot meeting summary noting `moviles.clubtal.com` + SWA hosting decision.
- [ ] Confirm `DEMO_VANITY_URL` env var example uses `https://moviles.clubtal.com`.
- [ ] Confirm no remaining references to demo-on-blob, Cloudflare CNAME → blob, or floating `demo.clubtal.com` as M0 outreach URL.

---

## Out of scope

- Automating Azure custom-domain DNS in deploy script (manual for M0).
- Configuring apex `clubtal.com` (marketing site).
- Founder DNS changes (document only; founder executes).
- Paying client blob hosting (unchanged — Task 32).
- Optional `demo.clubtal.com` → `moviles.clubtal.com` redirect.

---

## Acceptance criteria

1. Zero remaining `tuwebdemo.es` or `demo.clubtal.com` as M0 outreach URL in `business/tasks/todo/` or active roadmap.
2. M0 demo URL documented as `https://moviles.clubtal.com` everywhere.
3. Infrastructure docs describe SWA + semantic vertical subdomain pattern — not blob + Cloudflare CNAME, not floating single subdomain.
4. July 24 meeting summary amended with cross-reference to subdomain strategy decision.
5. Clear separation documented: SWA for Clubtal-owned surfaces, blob for paying clients.
