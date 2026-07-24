# Meeting Summary: Pivot to Mobile Repair Shops — Spain Static-Only Roadmap

**Date:** July 24, 2026
**Agents Present:** CEO, CPO, CGO, CTO
**Topic:** Reframe the roadmap — pivot from solo beauty professionals to mobile repair shops (Spain), deliver static websites only, price at €39/month + 21% IVA, acquire clients via WhatsApp DMs from a Google Maps scraper CSV.

---

## Each Agent's Key Points (Condensed)

### CEO
- Approved the pivot. The cell-phone-repair-shop template **already exists** in Spanish at `config/templates/cell-phone-repair-shop/` (index, servicios, contacto pages). Vertical switch has near-zero template cost.
- Proposed **demo-first tactic**: build the site from CSV data *before* the first WhatsApp message. First message = "here's your live site" — not "can I have 30 minutes?" Deletes the discovery call entirely.
  - Sample DM: *"Hola [Nombre], he montado una web para [Tienda] con vuestros datos de Google. Está aquí: reparaciones-madrid.es/tienda-x — si os gusta, la paso a vuestro dominio propio por 39€/mes + IVA, deducible. Si no, la borro y no os molesto más."*
- Unit economics: €390 MRR at 10 clients, ~94% gross margin (no Cosmos/Functions COGS).
- ROI pitch: *"Un arreglo de pantalla son €80. Necesitas una reparación extra cada dos meses para amortizarlo. Menos de un café al día."*
- **Cut from roadmap:** Tasks 03 (Cosmos), 04 (Functions), 05 (admin pipeline), 12–13 (admin features). No admin panel, no database, no booking system.
- **Lead filter:** scraper must filter to ≥20 Google reviews AND ≥4.0 rating. Zero-review listings are dead leads.
- **Kill switch week 6:** <2 paying clients from 300 DMs sent.
- **Key risks:** (1) Retention — no engagement loop on a brochure; needs automated monthly stats message (visits + WhatsApp clicks). (2) WhatsApp ban — dedicated second number, 20–30 DMs/day cap. (3) "Ya tengo Google" objection — pitch credibility + service/price list, not lead generation.
- **Open blocker:** Founder fiscal setup — alta en Hacienda, modelo 303 quarterly IVA, Spanish-compliant facturas. Stripe's default invoices are not valid Spanish facturas.

### CPO
- Aligned with CEO on killing the booking/DB/admin stack and demo-first acquisition.
- **Critical blocker (partially corrected by CTO):** The template homepage's `services` block has no `items` array and depends on a live `/api/booking-services` backend — so it renders completely blank on a static site. The fix is a static priced services block (5–6 repairs with euro prices). The CPO estimated 3 hours; the CTO found the fix is a 45-min backport from the already-working `demo-phone-repair-shop` client config.
- **Onboarding without discovery call:** scraper CSV data (business name, address, phone, hours, rating) is sufficient to auto-fill most template variables. Sensible defaults for the rest.
- **Site updates without admin panel:** WhatsApp → agent → JSON edit → `validate:client` → redeploy. ~5 min per update, manageable at 10 clients.
- **Monthly stats message** (visits + WhatsApp clicks) is M1 retention mechanism — not a nice-to-have.
- **No annual prepay plan** until 3-month churn data exists.
- 5 immediate tasks: (1) Template surgery, (2) Update pricing doc, (3) Simplify provision-client.mjs, (4) CSV→demo batch script, (5) Founder fiscal setup.

### CGO
- Demo-first tactic is a genuine funnel compressor — but **WhatsApp number warm-up is mandatory**.
  - Week 1: text-only messages, no demo link. Demo link only sent *on reply*.
  - Dedicated second WhatsApp Business number (not personal). Hard cap 20–30 DMs/day.
  - No link in first message until the number is warmed.
- **3-touch message sequence** with A/B Castilian Spanish variants.
- **4 objection-handling scripts** (including "Ya tengo Google," "Es muy caro," "No me fio," "Lo pienso").
- **Funnel target:** 2–5 paying clients per 100 DMs (vs. 1 per 100 on Instagram-beauty). WhatsApp to a published business number outperforms cold Instagram DMs.
- **5-hour/week founder rhythm** anchored on Sunday prep: batch-generate demos, queue DMs, send through the week.
- **Fiscal blocker tension:** run alta en Hacienda *in parallel* with outreach, not before. Two informal Bizum payments while pending is acceptable friction. Two weeks of zero outreach waiting for Hacienda paperwork is not.
- Sub-metrics for kill-switch diagnosis: reply rate (target ≥15%), demo-viewed rate, demo-viewed→paid rate (target ≥5%).

### CTO
- Audited the repo. **The static build already works today:** built `demo-phone-repair-shop` in 9.8 seconds with zero env vars, zero Cosmos, zero Functions. M1 engineering is ~1.5 days of agent work, not a rebuild.
- **CPO correction:** The template `features.booking` flag has zero runtime consumers — it changes nothing. The real bug is the blank `services` block (no items, no prices). Already prototyped in `config/clients/demo-phone-repair-shop/`. Backport is ~45 minutes.
- **Unnamed blocker #1:** `deploy-blob-storage.yml` calls `exit 1` when Cosmos/admin env vars are missing. Every demo deploy fails before it builds. Six-line fix.
- **Unnamed blocker #2 → Vetoed:** deploy workflow provisions one Azure Storage account per client via tag lookup. At 50 demos, this is 50 storage accounts before the first WhatsApp message. **Vetoed: one bucket, `basePath` path prefixes instead.** Cost: ~$1–2/month. One-line change to `next.config.ts`.
- **Cloudflare Web Analytics:** cookieless, GDPR/LSSI-CE compliant for Spain — no consent banner needed. One `<script defer>` beacon in `app/layout.tsx`. Demos share one token; paying clients get their own.
- **CPO correction on click-to-call:** Cloudflare Web Analytics cannot count `tel:` link clicks (no page load fired). WhatsApp clicks ARE trackable via a static redirect page (`/whatsapp/` → `wa.me`). Monthly stats report: **visits + WhatsApp clicks** (not calls).
- **Monthly stats automation deferred** until 5 paying clients. At 10 clients it's 10 numbers read off a dashboard once a month. Automation shape when warranted: scheduled GitHub Action → Cloudflare GraphQL API → zero backend, zero compute at rest.
- **Tenant isolation bug** in `data/company-profile-local.json` (single global file, hair salon in Oviedo): must be scoped per-client or return `null` before the first batch run. Cross-tenant data leak risk.
- **Agent-buildability:** JSON edits + redeploys are safe — conditional on shipping `npm run validate:client <clientId>` (offline schema validation via `ajv`). Without it, an agent can write an invalid config that passes CI and ships a broken page.

---

## Decisions & Recommendations

| # | Decision | Owner |
|---|---|---|
| D1 | **Pivot approved.** Vertical = mobile repair shops, Spain only. | CEO |
| D2 | **Product = static brochure only.** No booking system, no admin panel, no database, no Azure Functions in M1. | CEO + CTO |
| D3 | **Price = €39/month + 21% IVA.** Fully deductible for autonomos/companies. Test unchanged through first 30 conversations. No monthly discounts. | CEO |
| D4 | **Demo-first acquisition.** Build demo site from CSV before first WhatsApp message. First DM = "here's your live site." | CEO + CGO |
| D5 | **Lead filter:** ≥20 Google reviews AND ≥4.0 rating. Filter in scraper config before building demos. | CEO |
| D6 | **One Azure Storage bucket, path-prefix hosting for demos** (`/tienda-x/`). One `basePath` env var per build. Not one account per demo. | CTO |
| D7 | **WhatsApp warm-up protocol mandatory.** Text-only week 1. Demo link only on reply. Dedicated second number. 20–30 DMs/day hard cap. | CGO |
| D8 | **Cloudflare Web Analytics** (cookieless). No consent banner. Demos share one token. | CTO |
| D9 | **Monthly stats = visits + WhatsApp clicks.** Not click-to-call (untrackable on free tier). Automated at client #5. | CTO |
| D10 | **Kill switch week 6:** <2 paying clients from 300 DMs. Diagnose via reply rate / demo-viewed / demo-viewed→paid sub-metrics. | CEO + CGO |
| D11 | **Fiscal setup (alta en Hacienda, modelo 303) runs in parallel with outreach.** Do not block DMs on paperwork. | CGO |
| D12 | **No annual plan** until 3-month churn data. | CPO |
| D13 | **Task 10 (provision-client.mjs) spec is dead.** Replace with `generate-demos.mjs` (batch) and `promote-client.mjs` (demo → paid). | CTO |

---

## Points of Alignment

- All four roles agree: **kill the booking/DB/admin/Functions stack entirely for M1.** The complexity was appropriate for the previous vertical; it's a dead weight for a static brochure business.
- All agree on **demo-first tactic** as the highest-leverage change vs. the old roadmap (eliminates the 30-min discovery call, the single biggest founder-time line item).
- All agree **WhatsApp outperforms Instagram DMs** for this vertical (B2B published business number, higher expected reply rate).
- All agree **the existing template is the right starting point** — it just needs the static services/prices block and CTA retargeting to WhatsApp/phone.
- CEO + CTO aligned that **no Cosmos, no Functions** is the correct technical call — not a temporary shortcut, but the right permanent architecture for a brochure product.
- CPO + CTO aligned that **agent-driven JSON edits + redeploy** is a viable update mechanism at 10 clients, given schema validation is in place.

---

## Unresolved Tensions & Open Questions

| # | Tension / Question | Owner | Deadline |
|---|---|---|---|
| U1 | CPO's "template surgery = 3 hours" vs. CTO's "45-min backport." The backport is confirmed — but the static priced services block (T-B) is net-new work. Full estimate needs a PR scope before committing. | nextjs-frontend-developer | Before demo pipeline starts |
| U2 | Fiscal setup: which invoicing tool is used? Stripe's default invoices are not valid Spanish facturas. Must be compliant with Verifactu by Jan 2027 (sociedades) / Jul 2027 (autonomos). | Founder | Week 1 |
| U3 | What exactly does the scraper export? If it doesn't include review count, rating, and photo URLs, the lead filter (D5) and demo quality both degrade. | Founder | Before T-D starts |
| U4 | Realistic founder hours per week. The plan assumes ~5 hours. At 3 hours, 10 clients in 12 weeks is not achievable. Need honest commitment before milestones are locked. | Founder | Before week 1 |
| U5 | `tel:` click-to-call is untrackable in monthly stats (Cloudflare free tier). If call volume is the primary KPI the founder wants to show clients, alternative tracking (callrail, local redirect number) needs evaluation. | CTO + CGO | Before first paying client |
| U6 | Annual prepay offer: CEO recommends pushing annual hard (best churn defense, tax-filing benefit). CPO vetoes until 3-month churn data exists. | CEO + CPO | Week 12 |

---

## Engineering Task List (Prioritized)

| Task | Description | Est. | Dependency |
|---|---|---|---|
| **T-A** | Template surgery: backport demo-phone-repair-shop diff to template. Set `booking: false`, retarget CTAs to WhatsApp/phone, fix bottom action bar. | 45 min | None |
| **T-B** | Static priced services block on homepage. 5–6 repair services with euro prices. Replaces the empty catalog-dependent block. | 2 h | T-A |
| **T-C** | Remove `exit 1` guards from `deploy-blob-storage.yml` for missing Cosmos/admin env vars. Add `basePath` support to `next.config.ts`. | 30 min | None |
| **T-D** | `scripts/generate-demos.mjs`: CSV → client configs → batch static builds → `.demo-staging/`. Idempotent. Writes only to `config/clients/demo-*/`. Includes lead filter (≥20 reviews, ≥4.0 rating). | 3 h | T-A, T-B, T-C |
| **T-E** | Demo hosting: one Azure Storage account, one `$web` container, path-prefix per demo. Upload `.demo-staging/` via `az storage blob sync`. | 2 h | T-D |
| **T-F** | Cloudflare Web Analytics beacon in `app/layout.tsx`, gated on `analyticsToken` field in `client.schema.json`. | 30 min | None |
| **T-G** | `npm run validate:client <clientId>`: offline schema validation via `ajv`. Required before agent-driven JSON edits are safe. | 3 h | None |
| **T-H** | Fix tenant isolation bug: `data/company-profile-local.json` must be scoped per-client or return `null`. | 30 min | Before T-D first run |
| **T-I** | `scripts/promote-client.mjs`: rename `demo-{slug}` → `{clientId}`, set `customDomain`, drop `BASE_PATH`, rebuild, redeploy to Cloudflare-backed custom domain. | 2 h | T-E |
| **T-J** | CI grep: fail build if any `config/clients/**` file contains `servicesEndpoint` or `bookingServicesEndpoint`. Prevents regression to backend dependency. | 30 min | None |

**Acceptance gate for the entire demo pipeline:** `CLIENT_ID=demo-phone-repair-shop npm run build:blob` with a completely empty environment produces a homepage with visible, priced services and WhatsApp CTAs. Everything else is downstream of this.

**Cut entirely:** Old Tasks 03 (Cosmos), 04 (Functions), 05 (admin pipeline), 06 (Stripe integration), 07 (Resend), 10 (old provision-client.mjs spec), 12 (Today card stack), 13 (Revenue KPI tile), 14 (14-day trial billing), 15 (cold DM tracking — use a Google Sheet).

---

## Milestones (~5 founder hours/week)

| Milestone | Weeks | Goal |
|---|---|---|
| **M0** | 1–2 | T-A through T-J complete. 20 demo sites live on subdomain. First 20 WhatsApp messages sent (warm-up week, text-only). |
| **M1** | 3–6 | 2 paying clients, €78 MRR. WhatsApp outreach at 25 DMs/day. Kill switch: <2 paying from 300 DMs → diagnose sub-metrics. |
| **M2** | 7–10 | 5 paying clients, €195 MRR. Monthly stats message live for each client. |
| **M3** | 11–12 | 10 paying clients, €390 MRR. Referral nudge. Annual prepay offer evaluated. |

---

## Suggested Next Actions

1. **Founder (immediate):** Confirm hours/week, confirm scraper CSV columns (especially review count + rating), and initiate alta en Hacienda process in parallel with everything else.
2. **nextjs-frontend-developer agent (day 1):** Ship T-A + T-B + T-C as a single PR. Acceptance test: static build with empty env produces priced services homepage with WhatsApp CTAs.
3. **devops agent (day 2, after T-A+B+C merge):** Ship T-D + T-E (demo batch pipeline + single-bucket hosting).
4. **CTO agent (parallel):** Ship T-F + T-G + T-H + T-J (analytics beacon, schema validation, tenant isolation fix, CI grep guard).
5. **Founder (week 1 outreach):** Text-only WhatsApp warm-up. No demo links until the number has sent ≥50 messages over 5+ days with no blocks.
6. **CEO + Founder:** Choose a Spanish-compliant invoicing tool (Holded, Billin, Quaderno, or similar) that is Verifactu-ready for 2027.

---

*Meeting closed. Next checkpoint: end of Week 2 — acceptance gate (static build produces priced services page) + first 20 WhatsApp messages sent.*
