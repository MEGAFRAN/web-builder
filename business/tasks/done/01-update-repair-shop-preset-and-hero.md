# Task 01 — Update `repair-shop-es` preset and demo hero block

**Status:** Ready for development
**Priority:** High — blocks outreach conversion
**Owner:** nextjs-frontend-developer
**Estimated scope:** Small — 30 min
**Execution order:** 1 of 3
**Depends on:** None
**Next task:** business/tasks/todo/02-build-clubtal-one-pager.md
**Milestone:** M0 (Week 1)
**Source:** docs/meetings/summaries/2026-08-03-define-the-branding-of-clubtal.md

---

## Context

Following the branding meeting, the platform identity (`clubtal-brand`) and the demo/client identity (`repair-shop-es`) have been separated. The `repair-shop-es` preset currently uses a border radius of 8, which gives it a "startup app" look that damages credibility for local trade businesses. It must be updated to 4. Also, amber CTAs (`#f59e0b`) fail WCAG 1.4.3 with white text; they must use dark text (`#0f172a`). 
Additionally, the hero block on `moviles.clubtal.com` is the primary conversion surface. It must feature a specific, realistic business name in the H1, not a generic placeholder, to maximize reply rate.

---

## Technical Specifications

- Update `lib/theme-presets.ts` to set border radius to 4 for `repair-shop-es`.
- Ensure amber CTAs use `#0f172a` for text color.
- Check the hero component/config used for the `cell-phone-repair-shop` template demo (`moviles.clubtal.com`) and update the H1 placeholder to a specific business name (e.g., "Reparaciones Móviles [Real Name/City]").

---

## Requirements

- [ ] Update border radius for `repair-shop-es` to 4
- [ ] Fix WCAG contrast issue on amber CTAs
- [ ] Update demo hero block with a concrete business name

---

## Files touched

| Area | Paths |
|---|---|
| Presets | `lib/theme-presets.ts` |
| Demo Config | `config/templates/cell-phone-repair-shop/template.json` or related content |

---

## Out of scope

Do not modify the `clubtal-brand` preset.

---

## Acceptance criteria

1. The `repair-shop-es` preset has a border radius of 4.
2. Amber buttons use dark text color `#0f172a`.
3. The demo hero uses a realistic business name in the H1.