# Task 03 — QA demo site in Android WebView

**Status:** Ready for development
**Priority:** High — blocks outreach
**Owner:** devops
**Estimated scope:** Small — 30 min
**Execution order:** 3 of 3
**Depends on:** business/tasks/todo/01-update-repair-shop-preset-and-hero.md
**Next task:** None
**Milestone:** M0 (Week 1)
**Source:** docs/meetings/summaries/2026-08-03-define-the-branding-of-clubtal.md

---

## Context

Because our acquisition strategy relies entirely on cold WhatsApp DMs, the first time a prospect views our demo site (`moviles.clubtal.com`), it will be inside WhatsApp's in-app browser (Android WebView). We must ensure the site renders correctly in this environment before any links are sent.

---

## Technical Specifications

- Test the deployed `moviles.clubtal.com` site in an Android WebView / WhatsApp in-app browser simulator or real device.
- Check that the hero block, pricing, and all CTAs render correctly.
- Verify that there are no CSS glitches or layout breakages specific to the WebView engine.

---

## Requirements

- [ ] Perform visual QA on Android WebView
- [ ] Document any layout issues found
- [ ] Assign fixes to frontend developer if any breakages are discovered

---

## Files touched

| Area | Paths |
|---|---|
| Testing | N/A (Manual/Automated QA on live URL) |

---

## Out of scope

Do not perform full cross-browser QA (Safari, Firefox, etc.). Focus strictly on the WhatsApp in-app browser experience.

---

## Acceptance criteria

1. Demo site confirmed to render correctly in Android WebView.
2. Any layout bugs logged as follow-up tasks.