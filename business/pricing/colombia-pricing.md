# Colombia Pricing

**Company:** Clubtal (`clubtal.com`)  
**Market:** Colombia  
**Status:** **Phase 2 — deferred.** Spain-only for M0/M1 (weeks 1–12). Do not quote active pricing to Colombian prospects until this doc is updated post–Spain validation.  
**Currency:** COP only (when launched)  
**Source of truth:** `business/roadmap/2026-07-24-roadmap-to-first-10-paying-clients.md`

---

## Current initiative (July 2026)

| Item | Status |
|---|---|
| Active market | **Spain only** |
| Active vertical | Mobile repair shops |
| Active price | €39/mo + 21% IVA (see `spain-pricing.md`) |
| Colombia launch | After 10 paying Spain clients OR explicit CEO pivot — pricing TBD |

**Agents:** Do not use the archived May 2026 Colombia pricing below in outreach, copy, or product decisions. It is historical reference only.

---

## Phase 2 planning notes (not locked)

When Colombia launches, expect:

- Vertical-agnostic static brochure (same product as Spain)
- WhatsApp acquisition channel (Colombia-native)
- Local-currency COP pricing, PPP-adjusted vs Spain €39/mo
- Payment rails: Stripe COP and/or Wompi — revisit at launch
- Pricing and SKUs to be set by CEO when Phase 2 is approved

---

## Engineering references (deferred)

| Item | Status |
|---|---|
| Stripe COP SKUs (`CO_MONTHLY_COP`, `CO_ANNUAL_COP`) | Cut from M1 roadmap — old Task 06 |
| Wompi integration | Cut from M1 roadmap — old Task 06b |
| Cosmos billing fields | Cut from M1 roadmap — no admin/DB in static-only phase |

---

## Constraints

- **Do not acquire Colombian clients** under the current 12-week Spain initiative unless CEO explicitly authorizes a market expansion.
- **Do not quote USD** to end clients in any market.
- When Phase 2 pricing is locked, update this file and notify all agent definitions in `.cursor/agents/` and `.claude/agents/`.

---

## Archived — May 2026 pricing (do not use)

> Superseded July 24, 2026. Kept for historical context only.

| Plan | Price | Provider / SKU |
|---|---|---|
| Monthly | $49.000 COP/mo | Stripe — `CO_MONTHLY_COP` |
| Annual | $490.000 COP/yr | Wompi — one-time payment |

**Archived vertical:** Solo beauty professionals — peluquerías, uñas, cejas/pestañas, barberos.  
**Archived acquisition:** Cold WhatsApp + warm co-founder intros → 30-min discovery call.  
**Archived product:** Website + integrated booking widget + admin panel.  
**Archived kill-switch:** <1 paying per 50 WhatsApp contacts at week 6.

**Archived sales copy (do not use):**

- Headline: *Tu página web profesional con reservas online por $49.000 al mes.*
- Annual CTA: *Paga $490.000 al año y ahorra 2 meses.*
