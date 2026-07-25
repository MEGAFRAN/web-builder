# Project Roadmap: First 10 Paying Clients

> **⚠ Superseded — July 24, 2026**
> This document reflects the original May 2026 roadmap (solo beauty professionals, booking system, $25/month USD, Instagram DMs). It has been fully replaced by the July 24, 2026 pivot. See the current roadmap below, or the full meeting record at `docs/meetings/summaries/2026-07-24-pivot-mobile-repair-shops-spain.md`.

---

# Current Roadmap (July 24, 2026 Pivot)

**Date:** July 24, 2026
**Agents Present:** CEO, CPO, CGO, CTO
**Status:** Active
**Time Horizon:** 12 weeks from July 28, 2026

---

## 0. TL;DR

| Item | Decision |
|---|---|
| Goal | **10 paying clients at €39/month + IVA, €390 MRR, by end of week 12** |
| Vertical | **Mobile repair shops** (smartphone repair, screen replacement, accessories, unlocking) |
| Market | **Spain only** |
| Product | **Static brochure website** — services, prices, phone, address, WhatsApp CTA. No booking system, no admin panel, no database. |
| Price | **€39/month + 21% IVA** (= €47.19 total). 100% tax-deductible for autonomos and companies. |
| Company name | **Clubtal** (`clubtal.com` — domain owned) |
| Acquisition | **WhatsApp cold DMs** from Google Maps scraper CSV (shops without websites, ≥20 reviews, ≥4.0 rating). One **generic demo site** shared via **`https://moviles.clubtal.com`**. |
| Demo hosting | **Azure Static Web Apps** — one SWA + semantic vertical subdomain per demo (M0: `moviles.clubtal.com`). Clubtal-owned surfaces on SWA; paying clients on blob. |
| Paying client infra | One Azure Storage account per paying client → Cloudflare CNAME → client's custom domain. |
| Infra cost @ 10 clients | **~€23/month** (blob storage + Stripe fees only). Gross margin ~94%. |
| Founder bandwidth | **~10 hours/week** (2 jobs). Every process must be no-discovery-call, no-manual-code, script-driven. |
| Kill switch | Week 6: <2 paying clients from 300 DMs sent. |
| Fiscal | Alta en Hacienda + modelo 303 quarterly IVA + Spanish-compliant invoicing tool (Holded/Billin/Quaderno, Verifactu-ready). Run in parallel with outreach. |

---

## 1. What Changed from the May 2026 Roadmap

| Dimension | May 2026 (old) | July 2026 (current) |
|---|---|---|
| Vertical | Solo beauty professionals | Mobile repair shops |
| Market | Not specified | Spain only |
| Price | $25/month USD | €39/month + 21% IVA |
| Product | Full booking system + admin panel + Cosmos DB + Azure Functions | Static brochure website only |
| Acquisition | Instagram cold DMs → 30-min discovery call → concierge onboarding | WhatsApp DMs → generic demo link → close in chat |
| Billing infra | Stripe Checkout + Customer Portal + Resend | Bizum or payment link → Google Sheet row |
| Demo | Not planned | One generic demo per vertical at semantic subdomain (M0: `moviles.clubtal.com`), built from `demo-phone-repair-shop` client config |
| Provisioning | Complex: Stripe + Cosmos seed + Resend invite + DNS | Simple: clone template → fill fields → build → upload → manual CNAME |
| Infra cost @ 10 clients | $30–45/month | ~€23/month |
| Gross margin | ~82% | ~94% |
| Engineering effort to first client | 4 weeks (Tasks 03–11) | ~1 day (T-A through T-D) |

---

## 2. Decisions (Locked)

1. **Vertical:** Mobile repair shops, Spain only. One vertical for 12 weeks unless kill switch fires at week 6.
2. **Product:** Static brochure site only. No booking system, no admin panel, no Cosmos DB, no Azure Functions in M0/M1. Page config stays in JSON files; builds are SSG-only.
3. **Price:** €39/month + 21% IVA. Unchanged through first 30 conversations. No monthly discounts. Annual prepay deferred to week 12 review.
4. **Acquisition:** WhatsApp cold DMs → generic demo link → close in chat. No discovery call. No personalised per-lead demo site (GDPR risk, complexity).
5. **Demo site:** One build of `config/clients/demo-phone-repair-shop/` deployed to a dedicated **Azure SWA** resource. M0 outreach URL: **`https://moviles.clubtal.com`** — broad enough for repair, hybrid, and accessory mobile shops.
6. **Demo subdomain strategy:** **Semantic vertical subdomains** — one immutable URL per vertical (e.g. `moviles.clubtal.com`, `restaurante.clubtal.com`). One SWA resource per vertical. Never redeploy a floating subdomain when switching outreach verticals — past WhatsApp links must keep working. Never send raw `.azurestaticapps.net` URLs in cold WhatsApp.
7. **Clubtal-owned hosting on SWA; paying clients on blob.** `clubtal.com`, `cert.clubtal.com`, and vertical demo subdomains use SWA (within 10 free SWA cap). Paying client sites use Azure Blob `$web` + Cloudflare CNAME.
8. **WhatsApp warm-up mandatory.** Text-only week 1. Demo link only once number is warmed and/or on reply. Dedicated second WhatsApp Business number. 20–30 DMs/day hard cap.
9. **Lead filter:** ≥20 Google reviews AND ≥4.0 rating — applied to the scraper CSV before queueing DMs. Google Sheet is the outreach tracker.
10. **Cloudflare Web Analytics** (cookieless, no consent banner in Spain). Monthly stats to each paying client: visits + WhatsApp clicks. Automated at client #5; manual dashboard read at fewer.
11. **Kill switch week 6:** <2 paying clients from 300 DMs. Diagnose sub-metrics: reply rate (≥15% target), demo-viewed rate, demo-viewed→paid rate (≥5% target).
12. **Fiscal setup in parallel with outreach.** Do not block DMs on Hacienda paperwork.
13. **No booking system, no admin panel, no Cosmos, no Azure Functions** until a vertical that requires them is validated and paying.

---

## 3. Engineering Tasks (Prioritized)

Task files live in `business/tasks/todo/`. Execution order reflects dependencies.

### Wave 1 — Infrastructure fixes (parallel, ~1.5h total)

| File | Task | Est. |
|---|---|---|
| `24-fix-tenant-isolation-company-profile.md` | Scope `company-profile-local.json` per client — fix before first provision | 30 min |
| `25-fix-deploy-blob-workflow.md` | Remove `exit 1` guards for missing Cosmos/booking env vars in deploy workflow | 30 min |
| `26-validate-client-schema-gate.md` | `npm run validate:client` offline schema gate via ajv + CI integration | 3 h |
| `27-ci-guard-backend-config-keys.md` | CI grep: fail if any `config/clients/**` contains backend endpoint keys | 30 min |
| `28-cloudflare-analytics-beacon.md` | Cloudflare Web Analytics beacon + `/whatsapp` redirect page | 30 min |

### Wave 2 — Template (sequential)

| File | Task | Est. |
|---|---|---|
| `29-template-surgery-repair-shop.md` | Retarget all CTAs from booking to WhatsApp/phone; remove booking copy | 45 min |
| `30-static-priced-services-block.md` | Replace blank catalog-dependent services block with 5–6 static priced items | 2 h |

### Wave 3 — Deploy demo + onboard first client (sequential)

| File | Task | Est. |
|---|---|---|
| `31-deploy-generic-demo-site.md` | Deploy `demo-phone-repair-shop` to SWA; configure `moviles.clubtal.com` custom domain | 1 h |
| `32-provision-client-script.md` | `provision-client.mjs` — clone template, fill fields, build, upload, print CNAME checklist | 2 h |

**Total engineering effort to first paying client: ~1 day of agent work.**

**Acceptance gate:** `CLIENT_ID=demo-phone-repair-shop npm run build:blob` with empty env → priced services homepage with WhatsApp CTAs → **Actions → Deploy Demo Site** → live at `https://moviles.clubtal.com`.

### Dependency graph

```
Wave 1 (all parallel) ─────────────────────────────────────────────────────
24-fix-tenant-isolation
25-fix-deploy-workflow                      ─┐
26-validate-client                           ├─► Wave 2
27-ci-guard                                  │
28-analytics-beacon                         ─┘

Wave 2 (sequential) ─────────────────────────────────────────────────────
29-template-surgery ──► 30-static-services-block ─┐
                                                   │
                                                   ▼
Wave 3 (sequential) ─────────────────────────────────────────────────────
31-deploy-generic-demo ──► DEMO LIVE AT moviles.clubtal.com ──► FIRST DM SENT

32-provision-client ──► (after first paying client converts) ──► FIRST PAYING CLIENT
```

**Cut entirely from old roadmap:** Tasks 03 (Cosmos), 04 (Functions), 05 (admin pipeline), 06 (Stripe integration), 07 (Resend), 10 (old provision spec), 12 (Today card stack), 13 (KPI tile), 14 (14-day trial billing), 15 (cold DM tracking — use Google Sheet). Also cancelled: `generate-demos.mjs` batch pipeline, per-lead personalised demo sites, sub-path / `basePath` hosting.

---

## 4. Points of Alignment

- All roles agree: **no booking system, no admin, no database for M0/M1**. The complexity of the old stack was appropriate for the beauty booking vertical — it is dead weight for a static brochure business.
- **Generic demo + personalised WhatsApp message + semantic vertical subdomain** replaces the 30-minute discovery call, per-lead site generation, and untrustworthy raw Azure URLs in one move.
- **One SWA + semantic subdomain per vertical demo** scales cleanly when adding restaurants, bars, gyms, etc. — each vertical keeps a permanent URL; past DMs never break.
- **`moviles.clubtal.com` over `reparacion.clubtal.com`:** M0 target includes accessory-only and hybrid shops, not just repair shops.
- Static build already works today: `demo-phone-repair-shop` built in 9.8 seconds with zero env vars.
- Agent-driven JSON edits + redeploy is the paying-client update model (~5 min per update), gated by `validate:client`.

---

## 5. Unresolved Tensions & Open Questions

| # | Question | Owner | Deadline |
|---|---|---|---|
| U1 | Static priced services block scope — estimate before dev starts. | nextjs-frontend-developer | Before Wave 2 |
| U2 | Fiscal setup: which invoicing tool (Holded, Billin, Quaderno)? Must be Verifactu-ready for Jan 2027. | Founder | Week 1 |
| U3 | Scraper CSV columns — does it export review count, rating, and photo URLs? | Founder | Before outreach starts |
| U4 | Realistic founder hours per week. Plan assumes ~5. At 3, milestone dates shift. | Founder | Before week 1 |
| U5 | `tel:` click-to-call untrackable on Cloudflare free tier. Call tracking via redirect number if needed. | CTO + CGO | Before first paying client |
| U6 | Annual prepay offer — CEO wants it, CPO wants churn data first. Revisit at week 12. | CEO + CPO | Week 12 |
| U7 | ~~Demo subdomain~~ **Resolved:** `moviles.clubtal.com` on SWA (semantic vertical subdomain). Future verticals get own subdomain + SWA (e.g. `restaurante.clubtal.com`). | Founder | Week 1 |

---

## 6. Milestones (~5 founder hours/week)

| Milestone | Weeks | Goal | Success Criterion |
|---|---|---|---|
| **M0** | 1–2 | Infrastructure + demo live | Waves 1–2 merged. Demo accessible at `https://moviles.clubtal.com`. First 20 WhatsApp messages sent (warm-up, text-only). |
| **M1** | 3–6 | First 2 paying clients | 2 paying clients, €78 MRR. 25 DMs/day. Kill switch check at week 6: <2 from 300 DMs → diagnose sub-metrics. |
| **M2** | 7–10 | 5 paying clients | 5 clients, €195 MRR. Monthly stats WhatsApp to each client (visits + WhatsApp clicks). |
| **M3** | 11–12 | 10 paying clients | 10 clients, €390 MRR. Referral nudge. Annual prepay evaluated. |

---

## 7. Next Actions (week of July 28, 2026)

1. **Founder:** Configure `moviles.clubtal.com` custom domain on mobile-shop demo SWA. Confirm hours/week. Start alta en Hacienda.
2. **nextjs-frontend-developer:** Ship Wave 2 (T-A + T-B). Acceptance: static build produces priced services homepage with WhatsApp CTAs.
3. **devops (parallel):** Ship Wave 1 fixes (T-C, T-H). Ship Wave 3 deploy script (T-D) after Wave 2 merges.
4. **CTO (parallel):** Ship T-G (`validate:client`), T-F (analytics beacon), T-J (CI guard).
5. **Founder (week 1 outreach):** WhatsApp warm-up. Text-only. No demo link until number has sent ≥50 messages over 5+ days with no blocks.
6. **CEO + Founder:** Pick Spanish-compliant invoicing tool before first invoice.

---

## 8. Constraints (do not violate)

- **No database-backed page content.** All page configs remain JSON files under `config/clients/{clientId}/`.
- **No SSR for client sites.** SSG only; compile-time isolation by `CLIENT_ID`.
- **No booking system, admin panel, Cosmos DB, or Azure Functions** until a validated booking vertical is paying.
- **No per-client manual code.** Founder runs scripts; agents edit JSON files within their write sandbox.
- **No runtime CSS-in-JS.** Tailwind utility tokens + CSS variables only.
- **≤250 lines per file.** File-level sandboxing under `lib/`, `config/clients/{clientId}/`.
- **No paid ads.** Acquisition is WhatsApp DM + referral only.
- **€39/month price frozen** through first 30 conversations. No monthly discounts. Annual prepay not before week 12 review.
- **Agent write sandbox:** demo generator and provision scripts write only to `config/clients/` and their designated output dirs. Never `components/`, `lib/`, `app/`.

---

## Appendix: Original May 2026 Roadmap (Archived)

The original roadmap targeted solo beauty professionals at $25/month with a full booking stack (Cosmos DB, Azure Functions, Stripe, Resend, 30-min discovery call, Instagram DMs). It was superseded on July 24, 2026 following a pivot meeting (CEO, CPO, CGO, CTO) driven by:

- Founder gaining a second job, requiring maximum simplicity in every process.
- Kill-switch trigger from the May roadmap: beauty vertical did not reach 1 paying / 100 DMs by week 6 (T3 tension).
- Mobile repair shops identified as the fallback vertical: B2B buyer, deductible expense, WhatsApp-native, existing template in repo, no booking requirement.
- Static-only product eliminates all backend engineering cost and reduces infra margin from ~82% to ~94%.

Full archived agent discussion: see `docs/meetings/summaries/2026-07-24-pivot-mobile-repair-shops-spain.md`.

---

*Roadmap last updated: July 25, 2026. Next executive checkpoint: end of Week 2 — demo live at moviles.clubtal.com + first 20 WhatsApp messages sent.*
