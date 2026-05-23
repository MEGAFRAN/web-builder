# Project Roadmap: MVP to First 10 Paying Clients

**Date:** May 23, 2026
**Agents Present:** CEO, CPO, CTO
**Topic:** Project roadmap from current MVP state to first 10 paying clients
**Status:** Locked — pending Friday sign-off on CEO Question 1 (cut-list) and Question 4 ($50/mo infra ceiling)
**Time Horizon:** 90 days (12 weeks)

---

## 0. TL;DR

| Item | Decision |
|---|---|
| Goal | **10 paying clients at $25/month, $250 MRR, ≥90% 30-day retention by end of week 12** |
| Vertical | **Solo beauty professionals** (hair stylists, nail techs, brow/lash, solo barbers) |
| Acquisition | Cold-DM Instagram outreach + founder-led concierge onboarding (no paid ads) |
| Billing | **Stripe Checkout + hosted Customer Portal** |
| Email | **Resend** for transactional |
| Custom domains | **Cloudflare Free in front of Azure Blob `$web`** |
| Per-client provisioning | **~25 min steady-state** via `scripts/provision-client.mjs`; 15 min from client #2 onward |
| Projected infra cost @ 10 clients | **$30–45/month** (under the $50 ceiling, ≥80% margin floor preserved) |
| Kill switch | Vertical pivoted at week 6 if conversion < 1 paying client per 100 cold DMs |
| New tasks added | **12 tasks** (`06-*.md` through `17-*.md`) |

---

## 1. Each Agent's Key Points (Condensed)

### 1.1 CEO

**Classification:** roadmap
**Recommendation:** Commit the next 90 days to landing 10 paying clients at $25/month in **one vertical only — solo beauty professionals** — using founder-led concierge onboarding, with three commercial blockers added on top of the existing Tasks 03–05 backlog: **Stripe subscription billing, transactional email, and custom-domain mapping**. These three are non-negotiable to charge real money and look credible.

**Why this vertical:**
- Needs a website; lives off bookings; price-sensitive; weak technical skills; active on Instagram (cheap acquisition).
- Our `reservationBlock` + availability planner already cover their #1 pain (scheduling).
- The 27 blocks compose a beauty-pro starter template with no new block work required for M1.

**Milestones:**
- **M1 (weeks 1–4):** Backend + commercial blockers ship; beauty-pro template + 30-min discovery script ready. **Goal: 1 paying client at $25 MRR.**
- **M2 (weeks 5–8):** Cold-DM Instagram outreach + concierge onboarding repeated. **Goal: 5 paying clients, $125 MRR.** Kill-switch at week 6 if < 1 paying / 100 DMs.
- **M3 (weeks 9–12):** Case-study content + referral program. **Goal: 10 paying clients, $250 MRR, ≥90% 30-day retention.**

**Top 3 risks & mitigations:**
1. Infra slipping past week 4 → fall back to local-dev Route Handlers in production for the first 1–2 clients; do not block sales on infra.
2. Vertical not converting → kill-switch at week 6, pivot to solo tutors, mobile repair (plumbers/electricians), or yoga/pilates solo instructors.
3. Sign-ups that don't convert to paid → credit card on file at concierge call, 14-day trial that auto-charges, no skip.

**Next Action (next 48h):** Ship a one-page **Commercial MVP Spec** — CTO owns billing/email/domain decisions, CPO owns template + onboarding script — locked by **Friday May 29, 2026**.

---

### 1.2 CPO

**Classification:** roadmap-prioritization
**Directive:** Ship a single beauty-vertical starter template + founder-run 30-minute discovery script that populates a complete `client.json` and pushes a live, branded, bookable site to the client's custom domain in under 30 minutes — with **zero per-tenant code, zero net-new block types in M1**, and a mobile-first admin re-anchored on "today's bookings" as the activation surface.

**Six commitments delivered:**

1. **8-block solo-beauty-pro starter template** with placeholder copy mapped to `client.json` fields, ready to build this week. (Composition: `navbar` → `heroBlock` → `services` → `reservationBlock` → `testimonialsBlock` → `location` → `contactInfoBlock` → `footer`.)
2. **30-min discovery call script** with explicit question → `client.json` field mappings, ending in a fully populated `client.json` + `pages/home.json`. Founder runs it; no client typing required.
3. **6 content blocks as the trimmed beauty default** (the 8 above minus `navbar` and `footer` which are chrome). **21 of 27 blocks stay hidden** in the beauty template (e.g. `blog_list`, `caseStudiesBlock`, `caseStudyDetailBlock`, `pricingPageBlock`, `statsBlock`, `logoCloud`, `featureGridBlock`, `missionBlock`, `valuesBlock`, `teamBlock`, `breadcrumb`, `divider`, `carouselBlock`, `faqBlock`, `ctaBlock`, `hero` (basic), `contact`, `contactFormSection`, `servicesPageBlock`, `testimonialsPageBlock`). They are not deleted from the registry — they remain available for later verticals and post-launch additions.
4. **Keep the existing 4-section admin nav** (bookings / services / availability / settings) — collapsing to a single screen sacrifices the discovery the merchant needs in week 1 — **but redesign the Bookings entry view to a mobile-first "Today" card stack**: a vertical scroll of today's appointments with one-tap actions (call client, mark no-show, mark complete).
5. **First-60-seconds-after-login activation** is anchored on **the live site URL** (a prominent card: "Your site is live at `sallystyling.com` — open it →"), not an empty calendar. The "aha" is "your site is real and looks professional." The empty calendar is hidden behind a "View bookings" affordance until the first real booking arrives.
6. **The single retention KPI** displayed in-admin in month 1 is **monthly bookings revenue generated through the site** (a tile on the bookings page, sum of `service.price` for confirmed reservations this calendar month). One number. No dashboard sprawl. When this number exceeds $25 in any given month, churn risk is materially reduced because the client is now ROI-positive.

---

### 1.3 CTO

**Classification:** architectural-decision
**Directive:** Tasks 03+04+05 ship in 4 weeks as-scoped, joined by three commercial-blocker tasks (Stripe / Resend / Cloudflare-Blob) and a single idempotent founder-run provisioning script — all without breaking the no-DB-page-content, no-SSR, no-per-tenant-code, ≤250-LOC-per-file guardrails.

**Three commercial-blocker decisions (locked):**

| Concern | Decision | Why (one line) |
|---|---|---|
| Billing | **Stripe Checkout + hosted Customer Portal** | Zero PCI surface, zero billing UI to build, instant card-on-file at concierge call. |
| Transactional email | **Resend** | Cheap ($0 to 3K emails/mo, then $20/mo), great DX, native React Email templates, no SMTP plumbing. |
| Custom domains | **Cloudflare Free in front of Azure Blob `$web`** | $0 SSL, $0 DNS, $0 egress savings, simple CNAME flow. Vetoed: Azure Front Door (cost), Azure SWA custom domain (wrong primitive — SWA hosts our admin, not client sites). |

**Per-client provisioning:** ~25 min steady-state via a single founder-run script `scripts/provision-client.mjs` (idempotent — re-runnable safely). Down to ~15 min from client #2 onward once Cloudflare Origin CA cert is reused across tenants.

**Projected Azure cost at 10 paying clients:** **$30–45/month total** (Cosmos Serverless ~$15–25, Functions Consumption ~$5–10, Blob `$web` containers ~$5–10). Margin floor ($250 MRR × 80% = $50 infra max) is preserved. **Veto trigger: if Cosmos RU spikes from query inefficiency push us past $50, switch reservation lookups to point-reads keyed by `clientId+date`.**

**Hard vetoes reaffirmed for this roadmap:**
- No database-backed page content (all page configs remain JSON files).
- No SSR for client sites (SSG only, compile-time isolation by `CLIENT_ID`).
- No per-tenant Azure Functions (one shared Function App, `clientId` from JWT/path).
- No runtime CSS-in-JS (Tailwind tokens + CSS variables only).
- ≤250 lines per file, file-level sandboxing under `app/admin/`, `lib/`, `config/clients/{clientId}/`.

---

## 2. Decisions (Locked)

1. **Vertical:** Solo beauty professionals. One vertical for the full 90 days unless killed at week 6.
2. **Pricing:** $25/month flat. 14-day free trial. Card-on-file collected at concierge call. Auto-charge at trial end. No skip-trial discount.
3. **Acquisition motion:** Founder-run cold DMs on Instagram → 30-min discovery call → concierge onboarding → live site in same day → 14-day trial → auto-charge.
4. **Commercial blockers locked:** Stripe Checkout + Customer Portal, Resend, Cloudflare Free + Azure Blob `$web`.
5. **Per-client provisioning target:** ≤30 min founder time. CTO commits to 25 min steady-state, 15 min from client #2.
6. **Infra cost ceiling:** $50/month at 10 clients. Projected $30–45/month.
7. **First-60-seconds activation:** Live site URL card. Not the empty calendar.
8. **In-admin retention KPI:** Monthly bookings revenue through the site. One number on the bookings page.
9. **Block discipline:** Zero net-new block types in M1. M1 ships with the existing 27. New blocks only after first paying client and only if explicitly requested by ≥3 paying tenants.
10. **Cut list for Tasks 03–05 if week-3 slip detected:** `PATCH /admin/reservations/:id` and `DELETE /admin/schedule`. Both have local Route Handler fallbacks usable during M1.

---

## 3. Points of Alignment

- All three roles agree the **bottleneck to revenue is not features but commercial plumbing** (billing, email, custom domains). M1 ships these alongside the in-flight Cosmos + Functions work.
- **Concierge onboarding is acceptable and desirable at 10 clients.** It is the training set for the future onboarding agent. CEO + CPO + CTO all accept that month 1–3 has a human in the loop for new-tenant provisioning.
- **No new block types in M1.** Existing 27 are sufficient for the beauty vertical. Adding blocks now would dilute focus and slow the commercial-blocker work.
- **The admin must not grow.** CPO holds the line on the existing 4-section shape; only redesigns the Bookings entry surface. CTO confirms no schema changes required for the redesign.
- **Cosmos is the only persistence layer.** No new databases. No new collections beyond `admin-users`, `booking-services`, `booking-schedules`, `reservations` (Task 03 scope).
- **Mobile-first.** Both CPO (admin UX) and CEO (Instagram-DM acquisition implies mobile-savvy buyers) are aligned that mobile is the primary surface for admin work.

---

## 4. Unresolved Tensions & Open Questions

| # | Tension / Open Question | Owner | Resolution Deadline |
|---|---|---|---|
| T1 | If Tasks 03+04+05 slip past week 4, do we cut `PATCH /admin/reservations/:id` and `DELETE /admin/schedule`, or extend M1 by one week and delay first paying client? | CEO | Week 3 standup (June 12, 2026) |
| T2 | If Cosmos costs exceed projection at 10 clients, do we move reservation reads to point-reads (CTO mitigation), or batch lookups, or cap client growth? | CTO | First cost spike, or week 10 review |
| T3 | If conversion is < 1 paying / 100 DMs at week 6, which fallback vertical do we pivot to: solo tutors, mobile repair, or yoga/pilates? CPO has not yet built starter templates for any of these. | CEO + CPO | Week 6 kill-switch review (July 3, 2026) |
| T4 | Cold-DM volume needed for M2 (5 clients) at a 1% baseline = ~500 DMs/month. Is the founder able to send that volume themselves, or is a manual outreach VA needed (which the budget cannot afford yet)? | CEO | Week 5 |
| T5 | The "Today" card-stack Bookings redesign (CPO commitment 4) is not in the current Task 03–05 scope. Confirmed as Task 12. Does it block M1 first-client launch, or can it slip to M2? | CPO + CTO | Week 2 |
| T6 | Per-tenant Cloudflare configuration (DNS + cert) — is it scriptable end-to-end via the Cloudflare API, or does it require manual founder steps in the Cloudflare dashboard for the first ~5 clients? | CTO | Week 2 (during Task 08 spike) |

---

## 5. Engineering Roadmap (Tasks 06–17)

Sequenced by dependency. Effort: **S** = ≤2 days, **M** = 3–5 days, **L** = 1–2 weeks.
Milestone tags: **M1** = weeks 1–4, **M2** = weeks 5–8, **M3** = weeks 9–12.

### M1 — Commercial-Ready Platform + First Paying Client (weeks 1–4)

In flight already:
- **Task 03 — Cosmos DB Admin Containers** (`tasks/03-setup-cosmos-db-admin-containers.md`) [▶ in progress] [M] [M1]
- **Task 04 — Implement Admin Azure Functions** (`tasks/04-implement-admin-azure-functions.md`) [☐] [L] [M1]
- **Task 05 — Configure Unified Admin Deployment Pipeline** (`tasks/05-configure-admin-deploy-pipeline.md`) [☐] [M] [M1]

New for this roadmap:
- **Task 06 — Stripe Checkout + Customer Portal Integration** [M] [M1]
  Owner: devops + nextjs-frontend-developer. Wire Stripe Checkout for the $25/mo subscription, configure Customer Portal for self-service cancellation/card-update. One product, one price, one webhook → Cosmos `tenants` collection field `subscriptionStatus`. No billing UI in admin.

- **Task 07 — Resend Transactional Email Integration** [S] [M1]
  Owner: devops + nextjs-frontend-developer. Configure Resend, ship two React Email templates: (a) booking confirmation for end-customers, (b) admin invite/welcome for new tenants. Single shared Function endpoint `/api/send-email` gated by JWT.

- **Task 08 — Cloudflare + Azure Blob `$web` Custom Domain Mapping** [M] [M1]
  Owner: devops. Spike + production-ready flow for: per-tenant Cloudflare zone + CNAME + Origin CA cert → Azure Blob `$web` container. Document the manual steps that cannot yet be scripted (open question T6). Output: a runbook + a partial helper script `scripts/setup-domain.mjs`.

- **Task 09 — Solo-Beauty-Pro Starter Template** [S] [M1]
  Owner: nextjs-frontend-developer. Add `config/templates/solo-beauty-pro/` with `client.json` and `pages/home.json` composed of the 8 CPO-approved blocks with placeholder copy ready for variable substitution (e.g. `{{businessName}}`, `{{ownerFirstName}}`, `{{primaryService}}`, `{{address}}`, `{{phone}}`, `{{bookingHoursWeekday}}`). Schema-validate against `config/schemas/`. No new block types.

- **Task 10 — `scripts/provision-client.mjs` Idempotent Provisioning** [M] [M1]
  Owner: devops. Single founder-run CLI: takes a populated `client.json` + a `templateId` → clones template → writes `config/clients/{clientId}/` → runs `build:blob` → uploads to a new Azure Blob `$web` container named `client-{clientId}` → triggers `scripts/setup-domain.mjs` → seeds Cosmos with a default admin user + empty schedules → emits an admin invite via Resend. Re-runnable. Target: ≤25 min wall-clock for client #1, ≤15 min from client #2 onward.

- **Task 11 — Vertical Tag + Placeholder Schema (additive)** [S] [M1]
  Owner: cto + nextjs-frontend-developer. Additive schema fields only: `template.vertical: "beauty" | "tutors" | "repair" | …` and per-block optional `placeholderCopy` field. No breaking changes to any of the 27 existing block schemas. Used by Task 09 + Task 10 + the future onboarding agent.

### M2 — Repeatable Acquisition + Activation Polish (weeks 5–8)

- **Task 12 — "Today" Card-Stack Bookings Entry View** [M] [M2]
  Owner: nextjs-frontend-developer + ux-ui-designer. Redesign `/admin/bookings` mobile entry view to a vertical card stack of today's appointments. One-tap actions: call client (`tel:` link), mark no-show, mark complete. Existing data path, no Cosmos changes. CPO commitment #4.

- **Task 13 — In-Admin Monthly Bookings Revenue KPI Tile** [S] [M2]
  Owner: nextjs-frontend-developer. Single tile on `/admin/bookings`: "Booked through your site this month: $X". Sum of `service.price` across confirmed reservations in current calendar month, per `clientId`. Cosmos query is a single partition scan filtered by month. CPO commitment #6.

- **Task 14 — 14-Day Trial → Auto-Charge Billing Flow** [M] [M2]
  Owner: devops + nextjs-frontend-developer. Stripe Checkout with `trial_period_days=14`, card required upfront, auto-charge at trial end via webhook. Failed-payment retry + dunning email via Resend. Updates `subscriptionStatus` in Cosmos. Closes CEO Risk #3.

- **Task 15 — Cold-DM Outreach Tracking (lightweight)** [S] [M2]
  Owner: ceo + ops (non-codebase). Pick the cheapest tracker: a single Airtable / Google Sheet. Columns: `instagram_handle`, `dm_sent_at`, `replied_at`, `discovery_call_at`, `signup_at`, `paid_at`, `vertical_subniche`. **Not a feature in the platform** — explicitly out-of-codebase to preserve focus. Used to compute the week-6 kill-switch ratio.

### M3 — Retention + Compounding Acquisition (weeks 9–12)

- **Task 16 — Case-Study Page + Referral Mechanics** [M] [M3]
  Owner: nextjs-frontend-developer + ceo. (a) Build a public marketing page on our own marketing site (separate concern — not a tenant block) showcasing 3 case-study clients with metrics from Task 13. (b) Add a one-line referral nudge in the admin shell: "Refer a friend, get 1 month free" → tracks via a shared coupon code, no in-platform referral engine.

- **Task 17 — Post-MVP Block Affordance for Non-CTO Agents** [S] [M3]
  Owner: cto. Author `docs/agents/adding-a-block.md` documenting the exact files an agent may touch to add a new block (`components/blocks/*.tsx`, `config/schemas/blocks/*.schema.json`, `components/componentRegistry.ts`) and the files that are off-limits (`app/layout.tsx`, `lib/client-config.ts`, `scripts/*`). Includes a worked example and a Vitest contract test that fails if a registry entry has no schema. Unblocks future verticals without CTO involvement.

### Roadmap-at-a-glance dependency graph

```
M1 ──────────────────────────────────────────────────────────────────────
Task 03 (Cosmos) ──┐
                   ├─► Task 04 (Functions) ──┐
                   │                          ├─► Task 05 (Pipeline) ──┐
Task 11 (Schema) ──┘                          │                         │
                                              │                         │
Task 06 (Stripe)  ────────────────────────────┤                         │
Task 07 (Resend)  ────────────────────────────┤                         │
Task 08 (Cloudflare+Blob) ────────────────────┤                         │
Task 09 (Beauty Template) ────────────────────┤                         │
                                              ▼                         ▼
                                         Task 10 (provision-client.mjs) ──► FIRST PAYING CLIENT

M2 ──────────────────────────────────────────────────────────────────────
Task 12 (Today card stack)     ──┐
Task 13 (Revenue KPI tile)     ──┤──► 5 PAYING CLIENTS, $125 MRR
Task 14 (14-day trial billing) ──┤      (Week-6 kill-switch decision)
Task 15 (DM tracking sheet)    ──┘

M3 ──────────────────────────────────────────────────────────────────────
Task 16 (Case studies + referral) ──┐
Task 17 (Block-add affordance)    ──┴──► 10 PAYING CLIENTS, $250 MRR, ≥90% 30-day retention
```

---

## 6. Success Criteria (Measurable)

| Milestone | Date | Criterion | Owner |
|---|---|---|---|
| M1 | End of Week 4 (June 19, 2026) | 1 paying client at $25 MRR. End-to-end: cold DM → discovery call → live custom-domain site → trial → first auto-charge succeeds. | CEO |
| M1-tech | End of Week 4 | Tasks 03–11 all merged. Per-client provisioning ≤25 min wall-clock measured live. | CTO |
| M2 | End of Week 8 (July 17, 2026) | 5 paying clients, $125 MRR. Conversion ≥ 1 paying per 100 DMs sent (else trigger kill-switch). | CEO |
| M2-product | End of Week 8 | First client sees revenue KPI tile > $0 in-admin. CPO commitment #6 validated. | CPO |
| M3 | End of Week 12 (August 14, 2026) | 10 paying clients, $250 MRR, ≥90% 30-day retention across cohort. Two case-study clients live on marketing site. | CEO |

---

## 7. Next Actions (next 48 hours)

1. **CEO** drafts and locks the one-page **Commercial MVP Spec** by Friday May 29, 2026. Includes: vertical commit, 3 commercial-blocker decisions, milestone dates, kill-switch criterion.
2. **CTO** authorizes dev agents to begin writing the new task files in `tasks/06-*.md` through `tasks/17-*.md` once Friday's sign-off lands on T1 (cut-list) and the $50/mo infra ceiling.
3. **nextjs-frontend-developer agent** starts on **Task 09 (solo-beauty-pro starter template)** immediately — zero dependencies, validates the placeholder-substitution model, unblocks the CPO's discovery-call script.
4. **devops agent** continues **Task 03 (Cosmos containers)** in parallel.
5. **CPO** delivers the final 30-minute discovery call script (with explicit field mappings) by end of next week, so Task 09 placeholder copy can be locked.
6. **CEO + ops** stand up the cold-DM tracking sheet (Task 15) this week so M2 measurement begins on day 1 of M2.

---

## 8. Constraints Reaffirmed (do not violate)

- No database-backed page content. All page configs remain JSON files under `config/clients/{clientId}/` and `pages/`.
- No SSR for client sites. SSG only, compile-time isolation by `CLIENT_ID`.
- No per-tenant Azure Functions. One shared Function App, `clientId` resolved from JWT or path.
- No runtime CSS-in-JS. Tailwind utility tokens + CSS variables only.
- ≤250 lines per file. File-level sandboxing under `app/admin/`, `lib/`, `config/clients/{clientId}/`.
- No per-client manual code. Founder runs scripts; founder does not write code per tenant.
- No new block types in M1. Beauty vertical ships with the existing 27.
- No paid ads in the 90-day window. Acquisition is cold DM + concierge + referral only.
- No new admin sections. The 4-section nav (bookings / services / availability / settings) is frozen for the 90 days.
- $25/month price is frozen. No tiers introduced until ≥30 paying clients and validated willingness-to-pay data exists.

---

*Meeting closed. Next executive checkpoint: end of Week 4 (M1 review), June 19, 2026.*
