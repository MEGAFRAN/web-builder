# Spain Pricing

**Company:** Clubtal (`clubtal.com`)  
**Market:** Spain  
**Status:** Locked — July 24, 2026 pivot (supersedes May 23, 2026 beauty/booking pricing)  
**Currency:** EUR only (no USD prices shown to clients)  
**Source of truth:** `business/roadmap/2026-07-24-roadmap-to-first-10-paying-clients.md`

---

## Plans

| Plan | Price | Billing (M1) | Notes |
|---|---|---|---|
| Monthly | **€39/mo + 21% IVA** | Bizum or payment link → Google Sheet row | Total charged: **€47.19/mo** |
| Annual | **Deferred** | — | Revisit at week 12 after 3-month churn data |

**Price framing:** 100% tax-deductible for autónomos and companies.  
**ROI pitch:** *"Un arreglo de pantalla son €80. Necesitas una reparación extra cada dos meses para amortizarlo."*

**Constraint:** Price frozen through first 30 conversations. No monthly discounts.

---

## What's included

One flat price. No setup fee. No tiers at MVP.

- Static brochure website on a custom domain (services, prices, phone, address, WhatsApp CTA)
- Mobile-first design, deployed via Azure Blob static hosting
- Monthly stats message (visits + WhatsApp clicks) — automated at client #5
- Site updates via WhatsApp → agent JSON edit → redeploy (~5 min)

**Not included in M1:** booking widget, admin panel, Cosmos DB, Azure Functions, Stripe self-service billing.

---

## Target customer

- **Segment:** Mobile repair shops — smartphone repair, screen replacement, accessories, unlocking
- **Profile:** Autónomos and micro-businesses (<10 employees), B2B buyer, price-sensitive, WhatsApp-native
- **Primary pain:** No professional web presence; losing credibility to competitors with Google listings and service menus online

---

## Competitive positioning

| Alternative | Typical cost | Our advantage |
|---|---|---|
| Wix / Squarespace DIY | €17–25/mo + setup time | Done for you, zero technical skill |
| Agency | €500–3,000 setup + €100–300/mo | Zero setup, €39/mo flat + IVA |
| Google Business only | Free | Professional domain, service/price list, WhatsApp CTA |

**Positioning:** Lowest effort professional web presence for a repair shop that wants credibility and a shareable link — not a marketplace profile.

---

## Payment rails (M1)

| Method | Provider | When |
|---|---|---|
| Bizum | Manual | Primary at signup |
| Payment link | Stripe or bank transfer | Fallback |
| Tracking | Google Sheet row | Manual until Stripe ships post-M1 |

**Engineering:** Stripe Checkout + Customer Portal deferred until post-M1 validation. Old Task 06 spec is cut from active roadmap.

---

## Conversion flow

1. Cold WhatsApp DM → generic demo link (`https://moviles.clubtal.com`) → close in chat
2. No discovery call. No 14-day trial.
3. After payment, `provision-client.mjs` clones template → fill fields → build → upload → CNAME checklist
4. Live custom-domain site within hours

**M1 goal:** 2 paying Spain clients by week 6 (€78 MRR). Kill switch: <2 paying from 300 DMs.

---

## Tax (IVA)

| Scenario | Treatment |
|---|---|
| B2B autónomo / company | **21% IVA** on €39/mo base (= €47.19 total). 100% deductible for client. |
| Founder alta en Hacienda | Modelo 303 quarterly IVA. Spanish-compliant invoicing tool required (Holded/Billin/Quaderno). |

**Open question:** Formal OSS registration trigger — see roadmap U2.

---

## Acquisition

| Channel | Tactic |
|---|---|
| Primary | Cold WhatsApp DMs to mobile repair shops (Google Maps scraper CSV) |
| Demo | One generic demo at `https://moviles.clubtal.com` — personalise message, not site |
| Secondary | Referral nudge at client #5+ |

**Lead filter:** ≥20 Google reviews AND ≥4.0 rating.  
**Kill-switch (week 6):** <2 paying clients from 300 DMs sent → diagnose sub-metrics (reply rate ≥15%, demo-viewed→paid ≥5%).  
**WhatsApp rules:** Dedicated second number. Warm-up week 1 (text-only). 20–30 DMs/day cap.

**Tracking:** Google Sheet outreach tracker (not Task 15 Airtable spec — superseded).

---

## Sales copy (Spanish)

**Brand descriptor:** *"Clubtal — tu web profesional, lista hoy"*  
**Headline:** Tu web profesional por 39€/mes + IVA.  
**Sub:** Sin setup. Deducible. Tu dominio, tu marca.  
**Demo CTA:** Mira un ejemplo: https://moviles.clubtal.com  
**Close:** Sin compromiso. ¿Te interesa algo así para [Nombre de tienda]?

---

## Engineering references

| Item | Task / artifact |
|---|---|
| Demo deploy | `business/tasks/todo/31-deploy-generic-demo-site.md` |
| Client provision | `business/tasks/todo/32-provision-client-script.md` |
| Analytics | `business/tasks/todo/28-cloudflare-analytics-beacon.md` |
| Outreach copy | `business/tasks/todo/34-clubtal-outreach-copy.md` |

---

## Constraints (do not change without CEO sign-off)

- Price frozen at **€39/mo + 21% IVA** through first 30 conversations
- No USD-denominated prices for Spanish clients
- No tiers, upsells, or setup fees at MVP
- No paid ads in the 90-day window
- No annual prepay before week 12 review
- No booking system, admin panel, or database until a validated booking vertical is paying

---

## Archived — May 2026 pricing (do not use)

| Plan | Price | Status |
|---|---|---|
| Monthly | €19/mo | Superseded |
| Annual | €179/yr | Superseded |
| Vertical | Solo beauty professionals + booking | Superseded |
| Acquisition | Instagram DMs + discovery call | Superseded |
