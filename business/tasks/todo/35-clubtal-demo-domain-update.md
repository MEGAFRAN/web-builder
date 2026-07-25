# Task 35 — Update Demo Vanity Domain to clubtal.com

**Execution order:** 3 of 3  
**Status:** Ready for development  
**Priority:** High — demo deploy task and infra docs must use owned domain  
**Owner:** devops  
**Estimated scope:** Small — 30–60 min  
**Depends on:** None (can run in parallel with Tasks 33–34; founder configures DNS)  
**Next task:** None  
**Milestone:** M0 (Week 1)  
**Source:** `docs/meetings/summaries/2026-07-25-company-name-debate.md`

---

## Context

Founder owns **`clubtal.com`**. The July 24 pivot planned a separate vanity domain (`tuwebdemo.es` ~€10/year). With Clubtal decided, the demo link in WhatsApp outreach should use the owned domain — e.g. **`https://demo.clubtal.com`** CNAME → repair-vertical Azure blob static website endpoint via Cloudflare.

Raw `.web.core.windows.net` URLs must never appear in customer-facing outreach.

---

## Technical Specifications

### Files to update

| File | Change |
|---|---|
| `business/tasks/todo/31-deploy-generic-demo-site.md` | Replace all `tuwebdemo.es` with `demo.clubtal.com`; update sample WhatsApp message |
| `business/tasks/todo/28-cloudflare-analytics-beacon.md` | Replace vanity domain example with `demo.clubtal.com` |
| `docs/meetings/summaries/2026-07-24-pivot-mobile-repair-shops-spain.md` | Add amendment note: vanity domain resolved as `demo.clubtal.com` (see 2026-07-25 naming meeting) |
| `docs/infrastructure/demo-storage.md` | Create or update with Clubtal DNS pattern (if file exists from Task 31) |

### DNS pattern (founder — document steps, do not automate in M0)

1. Add `clubtal.com` to Cloudflare (if not already).
2. CNAME `demo` → Azure blob static website endpoint for repair-vertical storage account.
3. Enable Cloudflare proxy (orange cloud) for free SSL.
4. Set env var `DEMO_VANITY_URL=https://demo.clubtal.com` for deploy script output.

### Deploy script

Ensure `scripts/deploy-demo.mjs` (when created in Task 31) prints `DEMO_VANITY_URL` defaulting to `https://demo.clubtal.com`.

---

## Requirements

- [ ] Replace `tuwebdemo.es` references in tasks 28 and 31 with `demo.clubtal.com`.
- [ ] Document DNS setup steps in `docs/infrastructure/demo-storage.md`.
- [ ] Add amendment to July 24 pivot meeting summary noting Clubtal domain decision.
- [ ] Confirm `DEMO_VANITY_URL` env var example uses `https://demo.clubtal.com`.

---

## Out of scope

- Automating Cloudflare DNS in deploy script (manual for M0).
- Configuring apex `clubtal.com` (marketing site) — demo subdomain only for now.
- Founder DNS changes (document only; founder executes).

---

## Acceptance criteria

1. Zero remaining `tuwebdemo.es` references in `business/tasks/todo/` or active roadmap.
2. Demo vanity URL documented as `https://demo.clubtal.com` everywhere.
3. Infrastructure docs include Cloudflare CNAME → Azure blob pattern for Clubtal.
4. July 24 meeting summary amended with cross-reference to 2026-07-25 naming meeting.
