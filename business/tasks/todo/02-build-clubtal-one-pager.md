# Task 02 — Build and deploy clubtal.com one-pager

**Status:** Blocked — SWA deploy requires `SWA_TOKEN_clubtal` GitHub secret, Azure SWA resource `swa-clubtal`, and founder DNS for `clubtal.com`
**Priority:** Critical — blocks all outreach (parked domain kills trust)
**Owner:** nextjs-frontend-developer
**Estimated scope:** Medium — 2 h
**Execution order:** 2 of 3
**Depends on:** business/tasks/todo/01-update-repair-shop-preset-and-hero.md
**Next task:** business/tasks/todo/03-qa-demo-in-webview.md
**Milestone:** M0 (Week 1)
**Source:** docs/meetings/summaries/2026-08-03-define-the-branding-of-clubtal.md

---

## Context

Prospects will search "Clubtal" after receiving a cold WhatsApp DM. If `clubtal.com` is a parked domain, it kills the pitch immediately. We need a minimum viable one-page static site deployed to Azure Static Web Apps (SWA) under the `clubtal.com` domain using the `clubtal-brand` preset.

---

## Technical Specifications

- Create a single-page site for Clubtal.
- Name + fixed descriptor: "Clubtal — tu web profesional, lista hoy".
- Positioning line: "La web profesional para tu negocio — 39€/mes + IVA (100% deducible). Sin coste de alta."
- Include a link to the demo site (`moviles.clubtal.com`).
- Apply the `"preset": "clubtal-brand"` in the configuration.
- Follow existing multi-tenant Next.js SSG build and deployment steps for deploying to SWA.
- Compose the homepage from the section map in `docs/design/clubtal-homepage-section-map.md`:
  `heroBlock` → `featureGridBlock` → `valuesBlock` → `ctaBlock` (gray, price anchor) →
  `faqBlock` → `ctaBlock` (dark, WhatsApp close).

---

## Requirements

- [x] Build a one-page site for Clubtal
- [x] Incorporate name, descriptor, positioning line, and price
- [x] Add link to `moviles.clubtal.com`
- [x] Apply `clubtal-brand` preset
- [x] Compose full multi-section homepage per the section map
- [x] Add footer Legal column (Aviso legal, Privacidad)
- [ ] Replace `34XXXXXXXXX` WhatsApp placeholder with the real Business number
- [ ] Create `/aviso-legal` and `/privacidad` pages (LSSI-CE requirement, needs founder legal details)
- [ ] Deploy to SWA

---

## Files touched

| Area | Paths |
|---|---|
| Config | `config/clients/clubtal.json` (or similar for main site) |
| Layout | `app/[clientId]/page.tsx` (or related rendering) |

---

## Out of scope

Keep the marketing site to a single homepage plus the two required legal pages. Do not add
blog, booking, gallery, or menu features. Do not invent testimonials, client logos, or usage
stats — there are zero paying clients, so `testimonialsBlock`, `statsBlock`, and `logoCloud`
stay deferred until real clients exist.

---

## Acceptance criteria

1. Site displays correct branding and pricing.
2. Homepage renders all six sections and reads as a complete company site, not a stub.
3. Link to `moviles.clubtal.com` works.
4. WhatsApp CTA points at the real Business number.
5. Footer legal links resolve to real pages.
6. Site is deployed and accessible.