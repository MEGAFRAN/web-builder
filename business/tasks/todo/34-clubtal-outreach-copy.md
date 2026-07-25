# Task 34 — Write Clubtal WhatsApp Outreach Copy

**Execution order:** 2 of 3  
**Status:** Ready for development  
**Priority:** High — first WhatsApp messages need on-brand copy before outreach starts  
**Owner:** cgo  
**Estimated scope:** Small — 1–2 hours  
**Depends on:** `business/tasks/todo/33-clubtal-pricing-docs-update.md`  
**Next task:** `business/tasks/todo/35-clubtal-demo-domain-update.md`  
**Milestone:** M0 (Week 1)  
**Source:** `docs/meetings/summaries/2026-07-25-company-name-debate.md`

---

## Context

Acquisition is **WhatsApp cold DMs** to mobile repair shops in Spain (≥20 Google reviews, ≥4.0 rating). One generic demo site shared via **clubtal.com** (subdomain). The brand name **Clubtal** is coined — prospects won't infer the product from the name alone. Every message must pair the name with a fixed descriptor.

CGO analysis from the naming meeting: coined brands need the descriptor to explain; the name does the remembering. Clubtal reads as a legitimate agency name in a cold DM (not spam), unlike `TuWeb` constructions.

---

## Technical Specifications

### Deliverable location

Create or update: `business/outreach/spain-repair-shops-whatsapp.md`

### Required copy blocks

1. **Brand descriptor line** (fixed, used in every DM and IG bio):
   > *"Clubtal — tu web profesional, lista hoy"*

2. **3-touch WhatsApp sequence** (Castilian Spanish, A/B variants where useful):
   - Touch 1: intro + demo link (after warm-up week)
   - Touch 2: follow-up with ROI framing (€39/mo vs one screen repair)
   - Touch 3: soft close / objection pre-empt

3. **Sample Touch 1 message** (template):
   > "Hola [Nombre], soy de Clubtal — hacemos webs profesionales para tiendas de reparación de móviles. Aquí tenéis un ejemplo: **https://demo.clubtal.com** — Si os interesa algo así para [Nombre de tienda], por 39€/mes + IVA (deducible). Sin compromiso."

4. **4 objection handlers:**
   - "Ya tengo Google"
   - "Es muy caro"
   - "No me fio"
   - "Lo pienso"

5. **Referral phrase** (for client #5+ nudge):
   > "Mi web está en Clubtal"

### Constraints

- Never send raw `.web.core.windows.net` URLs — always `demo.clubtal.com` (or confirmed subdomain).
- WhatsApp warm-up: text-only week 1; demo link only after reply or once number is warmed.
- Hard cap: 20–30 DMs/day on dedicated second number.
- Price always stated as €39/mes + IVA (deducible).

---

## Acceptance criteria

1. `business/outreach/spain-repair-shops-whatsapp.md` exists with all 5 copy blocks above.
2. Every message template includes "Clubtal" + descriptor within the first two lines.
3. Demo URL uses `clubtal.com` subdomain (not `tuwebdemo.es`).
4. Objection handlers reference static brochure value (credibility, service/price list), not booking/leads.
5. Copy aligns with pricing in Task 33 output.
