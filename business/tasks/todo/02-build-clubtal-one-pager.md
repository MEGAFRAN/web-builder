# Task 02 — Build and deploy clubtal.com one-pager

**Status:** Ready for development
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
- Positioning line: "La web profesional para tu tienda, sin agencia y sin complicaciones — 39€/mes + IVA."
- Include a link to the demo site (`moviles.clubtal.com`).
- Apply the `"preset": "clubtal-brand"` in the configuration.
- Follow existing multi-tenant Next.js SSG build and deployment steps for deploying to SWA.

---

## Requirements

- [ ] Build a one-page site for Clubtal
- [ ] Incorporate name, descriptor, positioning line, and price
- [ ] Add link to `moviles.clubtal.com`
- [ ] Apply `clubtal-brand` preset
- [ ] Deploy to SWA

---

## Files touched

| Area | Paths |
|---|---|
| Config | `config/clients/clubtal.json` (or similar for main site) |
| Layout | `app/[clientId]/page.tsx` (or related rendering) |

---

## Out of scope

Do not build a complex multi-page site. Stick to the absolute minimum viable one-page structure.

---

## Acceptance criteria

1. Site displays correct branding and pricing.
2. Link to `moviles.clubtal.com` works.
3. Site is deployed and accessible.