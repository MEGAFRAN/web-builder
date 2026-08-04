# Meeting Summary: Pivot to Mobile Repair Shops — Spain Static-Only Roadmap

**Date:** July 24, 2026
**Agents Present:** CEO, CPO, CGO, CTO
**Topic:** Reframe the roadmap — pivot from solo beauty professionals to mobile repair shops (Spain), deliver static websites only, price at €39/month + 21% IVA, acquire clients via WhatsApp DMs from a Google Maps scraper CSV.

**Amendment (same day, founder):** Use **one generic demo site** (`config/clients/demo-phone-repair-shop`) for all outreach — do **not** generate a personalized site per lead from scraped data. Rationale: simpler engineering, faster to ship, GDPR/LSSI-safe (no publishing prospect identity without consent), avoids "creepiness" objection. Scraper CSV is for **lead queue + WhatsApp personalisation only**.

**Amendment 2 (same day, founder):** Demo hosting uses the **Azure Blob static website default URL at root** (e.g. `https://{account}.z43.web.core.windows.net/`) — **no sub-paths, no `basePath`**. **One Azure Storage account per vertical demo template** (repair shops now; restaurants, bars, gyms, etc. later). For WhatsApp outreach, use a cheap **vanity domain** (~€10/year, e.g. `tuwebdemo.es`) via Cloudflare free CNAME → blob endpoint — do **not** send raw `.web.core.windows.net` links in cold DMs (phishing appearance).

**Amendment 3 (July 25, 2026):** Company name = **Clubtal** (`clubtal.com` owned). Demo vanity URL = **`https://demo.clubtal.com`** — replaces `tuwebdemo.es`. See `docs/meetings/summaries/2026-07-25-company-name-debate.md`.

**Amendment 4 (July 25, 2026):** Demo hosting moved to **Azure Static Web Apps** with **semantic vertical subdomains**. M0 outreach URL = **`https://moviles.clubtal.com`** (mobile-shop demo SWA). Supersedes Amendment 2 (blob + `tuwebdemo.es`) and Amendment 3 (`demo.clubtal.com` as floating M0 URL). **Clubtal-owned surfaces** (`clubtal.com`, `cert.clubtal.com`, vertical demo subdomains) stay on SWA; **paying client sites** use Azure Blob Storage + Cloudflare CNAME. One SWA resource per vertical — past WhatsApp links never break when outreach shifts. See `docs/meetings/summaries/2026-07-25-company-name-debate.md` and `docs/infrastructure/demo-swa.md`.

---

## Each Agent's Key Points (Condensed)

### CEO
- Approved the pivot. The cell-phone-repair-shop template **already exists** in Spanish at `config/templates/cell-phone-repair-shop/` (index, servicios, contacto pages). Vertical switch has near-zero template cost.
- Originally proposed **personalised demo-first**: build a site from CSV data before the first WhatsApp message. **Amended:** one generic demo URL for all prospects; personalise the message, not the site.
  - Sample DM (amended): *"Hola [Nombre], soy de Clubtal — hacemos webs profesionales para tiendas de móviles. Aquí tenéis un ejemplo: **https://moviles.clubtal.com** — Si os interesa algo así para [Tienda], por 39€/mes + IVA, deducible. Sin compromiso."*
- Unit economics: €390 MRR at 10 clients, ~94% gross margin (no Cosmos/Functions COGS).
- ROI pitch: *"Un arreglo de pantalla son €80. Necesitas una reparación extra cada dos meses para amortizarlo. Menos de un café al día."*
- **Cut from roadmap:** Tasks 03 (Cosmos), 04 (Functions), 05 (admin pipeline), 12–13 (admin features). No admin panel, no database, no booking system.
- **Lead filter:** scraper must filter to ≥20 Google reviews AND ≥4.0 rating — for **outreach queue quality**, not for demo generation.
- **Kill switch week 6:** <2 paying clients from 300 DMs sent.
- **Key risks:** (1) Retention — no engagement loop on a brochure; needs automated monthly stats message (visits + WhatsApp clicks). (2) WhatsApp ban — dedicated second number, 20–30 DMs/day cap. (3) "Ya tengo Google" objection — pitch credibility + service/price list, not lead generation.
- **Open blocker:** Founder fiscal setup — alta en Hacienda, modelo 303 quarterly IVA, Spanish-compliant facturas. Stripe's default invoices are not valid Spanish facturas.

### CPO
- Aligned with CEO on killing the booking/DB/admin stack and demo-first acquisition (amended to generic demo).
- **Critical blocker (partially corrected by CTO):** The template homepage's `services` block has no `items` array and depends on a live `/api/booking-services` backend — so it renders completely blank on a static site. The fix is a static priced services block (5–6 repairs with euro prices). Backport from `config/clients/demo-phone-repair-shop/` — ~45 min plus net-new priced block work.
- **Onboarding without discovery call:** after payment, provision from template with client-specific fields (name, phone, address, hours) via script or agent — not from scraper-built demo configs.
- **Site updates without admin panel:** WhatsApp → agent → JSON edit → `validate:client` → redeploy. ~5 min per update, manageable at 10 clients.
- **Monthly stats message** (visits + WhatsApp clicks) is M1 retention mechanism — not a nice-to-have.
- **No annual prepay plan** until 3-month churn data exists.

### CGO
- Generic demo link is still a strong proof-of-work asset — personalise the WhatsApp copy with prospect name and shop name.
- **Vanity domain is required for conversion** — raw `.azurestaticapps.net` URLs in cold WhatsApp look like phishing; a readable semantic subdomain (`moviles.clubtal.com`) is the customer-facing link.
- **WhatsApp number warm-up is mandatory.** Text-only week 1; demo link only after reply (or once number is warmed).
- Dedicated second WhatsApp Business number. Hard cap 20–30 DMs/day.
- **3-touch message sequence** with A/B Castilian Spanish variants.
- **4 objection-handling scripts** (including "Ya tengo Google," "Es muy caro," "No me fio," "Lo pienso").
- **Funnel target:** 2–5 paying clients per 100 DMs (vs. 1 per 100 on Instagram-beauty).
- **5-hour/week founder rhythm:** Sunday prep = queue leads from CSV + draft DMs (no batch demo builds).
- **Fiscal setup runs in parallel with outreach** — do not block DMs on paperwork.

### CTO
- Audited the repo. **The static build already works today:** built `demo-phone-repair-shop` in 9.8 seconds with zero env vars. M1 engineering is **~1 day** of agent work after generic-demo amendment (batch pipeline cancelled).
- **Real demo-killer:** blank `services` block without backend — fix with static priced block; prototype in `demo-phone-repair-shop`.
- **`deploy-blob-storage.yml`** calls `exit 1` when Cosmos/admin env vars are missing — six-line fix.
- **Demo hosting (Amendment 4):** one build of `demo-phone-repair-shop` → dedicated **Azure SWA** resource → semantic vertical subdomain **`https://moviles.clubtal.com`**. Deploy via GitHub Actions (`deploy-demo-swa.yml`). Future verticals = separate SWA + subdomain each (e.g. `restaurante.clubtal.com`). Paying clients stay on blob storage.
- **Cloudflare Web Analytics:** cookieless, GDPR/LSSI-CE compliant — no consent banner. Works on vanity domain. WhatsApp clicks trackable via `/whatsapp/` redirect page; `tel:` links not trackable on free tier.
- **Tenant isolation bug** in `data/company-profile-local.json` — fix before first paying-client provision.
- **`validate:client`** required before agent-driven JSON edits are safe.

---

## Decisions & Recommendations

| # | Decision | Owner |
|---|---|---|
| D1 | **Pivot approved.** Vertical = mobile repair shops, Spain only. | CEO |
| D2 | **Product = static brochure only.** No booking, admin, database, or Azure Functions in M1. | CEO + CTO |
| D3 | **Price = €39/month + 21% IVA.** Test unchanged through first 30 conversations. No monthly discounts. | CEO |
| D4 | **Generic demo acquisition.** One live demo (`demo-phone-repair-shop`) shared in all WhatsApp outreach. Personalise message, not site. | CEO + CGO + Founder |
| D5 | **Lead filter:** ≥20 Google reviews AND ≥4.0 rating — for outreach queue only (scraper or sheet). | CEO |
| D6 | **Demo hosting (Amendment 4):** one Azure SWA resource per vertical; M0 URL **`https://moviles.clubtal.com`**. Deploy via GitHub Actions. Clubtal-owned surfaces on SWA; paying clients on blob. | CTO + Founder |
| D7 | **Semantic vertical subdomains for outreach** — e.g. `moviles.clubtal.com`, `restaurante.clubtal.com`. Never send raw `.azurestaticapps.net` in cold WhatsApp. | CGO + Founder |
| D8 | **WhatsApp warm-up mandatory.** Text-only week 1. Demo link when appropriate. 20–30 DMs/day cap. | CGO |
| D9 | **Cloudflare Web Analytics** (cookieless). Demos share one token on vanity domain. | CTO |
| D10 | **Monthly stats = visits + WhatsApp clicks.** Automated at client #5. | CTO |
| D11 | **Kill switch week 6:** <2 paying from 300 DMs. | CEO + CGO |
| D12 | **Fiscal setup in parallel with outreach.** | CGO |
| D13 | **No annual plan** until 3-month churn data. | CPO |
| D14 | **Old Task 10 spec dead.** Replace with GitHub Actions demo deploy (`deploy-demo-swa.yml`) + `provision-client.mjs`. **`generate-demos.mjs` cancelled.** | CTO |

---

## Points of Alignment

- Kill the booking/DB/admin/Functions stack entirely for M1.
- **Generic demo + personalised WhatsApp + semantic vertical subdomain** replaces discovery call, per-lead sites, and untrustworthy raw Azure URLs.
- **One SWA + semantic subdomain per vertical demo** — scales cleanly when adding restaurants, bars, gyms, etc.; past WhatsApp links never break.
- **Clubtal-owned surfaces on SWA; paying clients on blob** — clear hosting split.
- WhatsApp outperforms Instagram DMs for this vertical.
- Existing template + `demo-phone-repair-shop` are the right starting point — template surgery + static prices still required.
- Agent-driven JSON edits + redeploy is the update model at 10 clients, with schema validation.

---

## Unresolved Tensions & Open Questions

| # | Tension / Question | Owner | Deadline |
|---|---|---|---|
| U1 | Static priced services block scope — backport + net-new homepage block. | nextjs-frontend-developer | Before demo deploy |
| U2 | Fiscal setup: invoicing tool (Holded, Billin, Quaderno) — Verifactu-ready for 2027. | Founder | Week 1 |
| U3 | Scraper CSV columns for outreach queue (name, phone, city, reviews, rating). | Founder | Before outreach |
| U4 | Realistic founder hours/week (~5 assumed). | Founder | Before week 1 |
| U5 | `tel:` click tracking untrackable on Cloudflare free tier. | CTO + CGO | Before first paying client |
| U6 | Annual prepay: CEO vs CPO — defer to week 12. | CEO + CPO | Week 12 |
| U7 | ~~Demo subdomain~~ **Resolved (Amendment 4):** `moviles.clubtal.com` on SWA (semantic vertical subdomain). Future verticals get own subdomain + SWA (e.g. `restaurante.clubtal.com`). | Founder | Week 1 |

---

## Engineering Task List (Prioritized)

| Task | Description | Est. | Dependency |
|---|---|---|---|
| **T-H** | Fix tenant isolation in `company-profile-local.json` | 30 min | None |
| **T-C** | Remove deploy workflow `exit 1` guards for static builds (no `basePath`) | 30 min | None |
| **T-G** | `npm run validate:client` schema gate + CI | 3 h | None |
| **T-J** | CI guard against backend config keys in client configs | 30 min | None |
| **T-F** | Cloudflare Web Analytics beacon + `/whatsapp` redirect | 30 min | None |
| **T-A** | Template surgery: WhatsApp/phone CTAs, remove booking copy | 45 min | None |
| **T-B** | Static priced services block on homepage | 2 h | T-A |
| **T-D** | Deploy generic demo to mobile-shop SWA + `moviles.clubtal.com` custom domain docs | 1 h | T-A, T-B, T-C |
| **T-E** | `provision-client.mjs` — clone template → paying client + custom domain | 2 h | T-D, T-G |

**Cancelled:** `generate-demos.mjs`, sub-path / `basePath` hosting, per-lead path prefixes, promote-demo rename flow.

**Acceptance gate:** `CLIENT_ID=demo-phone-repair-shop npm run build:blob` with empty env produces homepage with visible priced services and WhatsApp CTAs; then **Actions → Deploy Demo Client - SWA** publishes it to SWA at `https://moviles.clubtal.com`.

**Cut entirely:** Old Tasks 03–07, 10 (old spec), 12–15, batch demo pipeline.

---

## Milestones (~5 founder hours/week)

| Milestone | Weeks | Goal |
|---|---|---|
| **M0** | 1–2 | T-H through T-D complete. Generic demo live at `https://moviles.clubtal.com`. First 20 WhatsApp messages (warm-up, text-first). |
| **M1** | 3–6 | 2 paying clients, €78 MRR. 25 DMs/day. Kill switch: <2 paying from 300 DMs. |
| **M2** | 7–10 | 5 paying clients, €195 MRR. Monthly stats message per client. |
| **M3** | 11–12 | 10 paying clients, €390 MRR. Referral nudge. Annual prepay evaluated. |

---

## Suggested Next Actions

1. **Founder:** Configure `moviles.clubtal.com` custom domain on mobile-shop demo SWA (Azure Portal → Custom domains → CNAME `moviles` → `{swa-name}.azurestaticapps.net`). Confirm hours/week and scraper CSV columns. Start alta en Hacienda in parallel.
2. **nextjs-frontend-developer:** Ship T-A + T-B (+ T-C deploy fix if paired) — acceptance: static build with priced services homepage.
3. **devops:** Ship T-D (`deploy-demo-swa.yml` + `docs/infrastructure/demo-swa.md`) — demo SWA, custom domain docs, M0 URL `https://moviles.clubtal.com`.
4. **Parallel:** T-F, T-G, T-H, T-J.
5. **Founder (week 1):** WhatsApp warm-up; share **`https://moviles.clubtal.com`** demo link once number is ready.
6. **CEO + Founder:** Pick Spanish-compliant invoicing tool.

---

*Meeting closed. Amendments: generic demo only; blob root + one account per vertical (Amendment 2, superseded for demos by Amendment 4); semantic vertical subdomains on SWA (`moviles.clubtal.com`). Next checkpoint: end of Week 2 — demo live at `https://moviles.clubtal.com` + first 20 WhatsApp messages sent.*
