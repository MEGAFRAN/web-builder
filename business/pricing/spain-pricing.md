# Spain Pricing

**Market:** Spain  
**Status:** Locked — May 23, 2026  
**Currency:** EUR only (no USD prices shown to clients)  
**Source of truth:** `business/roadmap/2026-05-23-roadmap-to-first-10-paying-clients.md`

---

## Plans

| Plan | Price | Stripe SKU | Effective monthly |
|---|---|---|---|
| Monthly | **€19/mo** | `ES_MONTHLY_EUR` | €19 |
| Annual | **€179/yr** | `ES_ANNUAL_EUR` | ~€14.92 (22% off) |

**Annual framing:** “Paga anual y te regalamos 2 meses.”

---

## What’s included

One flat price. No setup fee. No tiers at MVP.

- AI-built static website on a custom domain
- Integrated booking widget (`reservationBlock`)
- Mobile-first admin: bookings, services, availability
- Transactional emails (booking confirmations, admin invite)
- Self-service billing via Stripe Customer Portal (card update, cancel)

---

## Target customer

- **Segment:** Solo beauty professionals — peluquerías, uñas, cejas/pestañas, barberos autónomos
- **Profile:** Autónomos and micro-businesses (<10 employees), price-sensitive, low technical skill, mobile-first
- **Primary pain:** Need online presence + appointment scheduling without agency cost (€500–3,000 setup + €100–300/mo)

---

## Competitive positioning

| Alternative | Typical cost | Our advantage |
|---|---|---|
| Wix Business | €17–25/mo + Bookings extra | Website + booking included at €19 |
| Agency | €500–3,000 setup + €100–300/mo | Zero setup, €19/mo flat |
| Booksy / Fresha | Free + commission | Flat fee, own brand/domain |

**Positioning:** Lowest effort + lowest total cost for a solo operator who wants a real site and bookings, not a marketplace profile.

---

## Payment rails

| Method | Provider | When |
|---|---|---|
| Card (Visa/Mastercard) | Stripe Checkout (EUR) | Default at signup |
| SEPA Direct Debit | Stripe (EUR) | Secondary — enabled in ES checkout sessions |
| Self-service billing | Stripe Customer Portal | Ongoing (card update, cancel, plan change) |

**Engineering:** Task 06 — Stripe Checkout + Customer Portal (M1)

---

## Trial & conversion flow

1. Cold Instagram DM → 30-min discovery call (ES script)
2. Founder populates `client.json` during call
3. Live custom-domain site same day
4. **14-day free trial** — card required at concierge call
5. Auto-charge at trial end (no skip-trial discount)

**M1 goal:** 1 paying Spain client at €19/mo by end of week 4.

---

## Tax (IVA) — MVP stage

| Scenario | Treatment |
|---|---|
| B2B autónomo with valid CIF/NIF-IVA | Reverse charge — no IVA collected by us; client self-accounts |
| Below OSS threshold (~€10K cross-border B2C/year) | No IVA collected at MVP |
| Above OSS threshold | Register for OSS; collect IVA 21% on Spanish B2C |

**Client record field:** `taxStatus` on `admin-users` Cosmos document.  
**Open question:** Formal OSS registration trigger at client #15 or €5K revenue — see roadmap T7.

---

## Acquisition

| Channel | Tactic |
|---|---|
| Primary | Cold Instagram DMs to solo beauty pros |
| Secondary | Local referrals, case studies (M3) |

**Kill-switch (week 6):** < 1 paying client per 100 Instagram DMs sent → pivot vertical or channel.

**Tracking:** Task 15 outreach sheet — tab `ES-Instagram`.

---

## Sales copy (Spanish)

**Headline:** Tu web profesional con reservas online por €19/mes.  
**Sub:** Sin setup. Sin comisiones. Tu dominio, tu marca.  
**Annual CTA:** Paga €179 al año y ahorra 2 meses.  
**Trial CTA:** Prueba 14 días gratis. Solo necesitas tu tarjeta al registrarte.

---

## Engineering references

| Item | Task / artifact |
|---|---|
| Stripe 4-SKU setup | Task 06 — `scripts/setup-stripe-products.mjs` |
| Provisioning flags | `--market ES --plan monthly\|annual` |
| Cosmos fields | `market: "ES"`, `planSku`, `subscriptionStatus`, `paymentProvider: "stripe"`, `taxStatus` |
| Discovery script | CPO — ES version (due week 1) |

---

## Constraints (do not change without CEO sign-off)

- Price frozen at **€19/mo** and **€179/yr** until ≥30 paying clients across both markets
- No USD-denominated prices for Spanish clients
- No tiers, upsells, or setup fees at MVP
- No paid ads in the 90-day window
