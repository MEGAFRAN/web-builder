# Colombia Pricing

**Market:** Colombia  
**Status:** Locked — May 23, 2026  
**Currency:** COP only (no USD prices shown to clients)  
**Source of truth:** `tasks/2026-05-23-roadmap-to-first-10-paying-clients.md`

---

## Plans

| Plan | Price | Provider / SKU | Billing model |
|---|---|---|---|
| Monthly | **$49.000 COP/mo** | Stripe — `CO_MONTHLY_COP` | Recurring subscription |
| Annual | **$490.000 COP/yr** | Wompi — one-time payment | One-time + T-30 renewal reminder via Resend |

**Annual framing:** “Paga anual y te regalamos 2 meses.” (~17% off vs monthly)

**USD equivalent (reference only, not shown to clients):** ~$12 USD/mo at current FX — PPP-adjusted vs Spain €19.

---

## What’s included

One flat price. No setup fee. No tiers at MVP.

- AI-built static website on a custom domain
- Integrated booking widget (`reservationBlock`)
- Mobile-first admin: bookings, services, availability
- Transactional emails (booking confirmations, admin invite, annual renewal reminder)
- Self-service billing where supported (Stripe Customer Portal for monthly COP subscribers)

---

## Target customer

- **Segment:** Solo beauty professionals — peluquerías, uñas, cejas/pestañas, barberos
- **Profile:** Solo operators, price-sensitive, low technical skill, mobile-first, often no international credit card
- **Primary pain:** Instagram/WhatsApp-only presence; need a real site + booking without Agendapro-level cost or commission

---

## Competitive positioning

| Alternative | Typical cost | Our advantage |
|---|---|---|
| Agendapro | ~$80.000–150.000 COP/mo | Lower entry price, own domain/brand |
| Instagram + WhatsApp only | Free | Professional site + structured booking |
| Wix (USD card required) | ~$25 USD/mo + FX fees | Local currency, local payment rails |

**Positioning:** Affordable, local-currency website + booking for solo operators who cannot or will not pay in USD.

---

## Payment rails

| Plan | Primary | Fallback | Methods |
|---|---|---|---|
| Monthly | **Stripe COP** | — | Card (COP-denominated) |
| Annual | **Wompi** (one-time) | Stripe COP annual | PSE, Nequi, Daviplata, card |

**Why split providers:**
- Wompi has no native recurring subscriptions — building tokenized recurring is M3+ (gated on ≥3 paying CO clients requesting it)
- Monthly recurring routes to **Stripe COP** (Task 06)
- Annual one-time routes to **Wompi** + Resend Timer T-30 renewal email (Task 06b)

**Engineering:**
- Task 06 — Stripe Checkout (includes `CO_MONTHLY_COP`, `CO_ANNUAL_COP` SKUs)
- Task 06b — Wompi integration (M2, must ship by week 6)

**Provisioning flag:** `--market CO --plan monthly|annual --payment-provider stripe|wompi`

---

## Trial & conversion flow

1. Cold WhatsApp message or warm co-founder intro → 30-min discovery call (CO script)
2. Founder populates `client.json` during call
3. Live custom-domain site same day
4. **14-day free trial** — card or PSE mandate collected at concierge call
5. Auto-charge at trial end (no skip-trial discount)

**First Colombia client expected:** Week 5+. Wompi (Task 06b) does not block M1 (Spain-first).

---

## Tax (IVA) — MVP stage

| Scenario | Treatment |
|---|---|
| Foreign service provider (entity in Spain) | Colombian buyer may self-withhold IVA on imported services — messy for client |
| Colombian co-founders incorporate local SAS | Collect IVA 19% locally — cleaner for Colombian clients |
| Below DIAN “responsable de IVA” threshold | No IVA collected at MVP |

**Client record field:** `taxStatus` on `admin-users` Cosmos document.  
**Open question (T8):** If Colombian SAS is incorporated before 10 clients, Wompi checkout must add IVA 19% line item — flag on incorporation decision.

---

## Acquisition

| Channel | Tactic |
|---|---|
| Primary | Cold WhatsApp outreach to solo beauty pros |
| Secondary | Warm intros from Colombian co-founder network |

**Kill-switch (week 6):** < 1 paying client per 50 WhatsApp contacts → pivot vertical or channel.

**Tracking:** Task 15 outreach sheet — tab `CO-WhatsApp`.

**Note:** Instagram DMs underperform in Colombia for this segment. WhatsApp Business is the dominant business channel.

---

## Sales copy (Colombian Spanish)

**Headline:** Tu página web profesional con reservas online por $49.000 al mes.  
**Sub:** Sin setup. Sin comisiones. Tu dominio, tu marca.  
**Annual CTA:** Paga $490.000 al año y ahorra 2 meses.  
**Trial CTA:** Prueba 14 días gratis. Tarjeta o PSE al registrarte.  
**Payment reassurance:** Paga en pesos colombianos. Aceptamos PSE, Nequi y tarjeta.

---

## Engineering references

| Item | Task / artifact |
|---|---|
| Stripe COP SKUs | Task 06 — `CO_MONTHLY_COP`, `CO_ANNUAL_COP` |
| Wompi hosted checkout | Task 06b — `createWompiTransaction`, `wompiWebhook` |
| Annual renewal email | Task 06b — Resend Timer T-30 before expiry |
| Provisioning flags | `--market CO --plan monthly\|annual --payment-provider stripe\|wompi` |
| Cosmos fields | `market: "CO"`, `planSku`, `subscriptionStatus`, `paymentProvider`, `taxStatus` |
| Discovery script | CPO — CO version (due week 1) |

---

## Roadmap timing

| Milestone | Colombia-specific deliverable |
|---|---|
| M1 (week 4) | Stripe COP SKUs live; first client may be Spain-only |
| M2 (week 6) | **Task 06b Wompi must ship** before scaling CO acquisition |
| M3 (week 12) | Wompi tokenized monthly recurring — only if ≥3 paying CO clients request it |

---

## Constraints (do not change without CEO sign-off)

- Price frozen at **$49.000 COP/mo** and **$490.000 COP/yr** until ≥30 paying clients across both markets
- No USD-denominated prices for Colombian clients
- No tiers, upsells, or setup fees at MVP
- No Wompi tokenized recurring in M1 or M2
- No paid ads in the 90-day window
