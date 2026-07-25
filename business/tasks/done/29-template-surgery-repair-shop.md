# Task: Template Surgery — Repair Shop Static Pivot (T-A)

**Status:** Ready for development
**Priority:** Critical — blocks the entire demo pipeline
**Owner:** nextjs-frontend-developer
**Estimated scope:** Small — 45 min backport
**Depends on:** None
**Milestone:** M0 (Week 1)
**Source:** `docs/meetings/summaries/2026-07-24-pivot-mobile-repair-shops-spain.md`

---

## Context

The platform is pivoting to deliver static brochure websites to mobile repair shops in Spain. The existing template at `config/templates/cell-phone-repair-shop/` was built with booking enabled and contains CTAs, copy, and a bottom action bar wired to the booking flow. All of those must be retargeted to WhatsApp and phone before any demo site can be generated.

The `config/clients/demo-phone-repair-shop/` client config already prototypes the correct end state. This task is a backport of that diff to the template itself. No net-new component work is required here — that is Task T-B.

**Acceptance gate for the entire demo pipeline:** `CLIENT_ID=demo-phone-repair-shop npm run build:blob` with a completely empty environment must produce a homepage with visible, priced services and WhatsApp CTAs. This task is the first step toward that gate.

---

## Technical Specifications

### What must change in `config/templates/cell-phone-repair-shop/`

1. **`template.json` and `client.json`**
   - Set `"booking": false`.
   - Update any `description` field that still references booking.

2. **`pages/index.json` — CTAs**
   - Retarget all `"ctaAction"`, `"primaryButtonHref"`, and `"secondaryButtonHref"` values that point to `#services`, `#reservar`, or booking anchors to `https://wa.me/{{whatsapp}}` and `tel:{{phone}}` respectively.
   - The hero CTA should open WhatsApp. The secondary CTA (if present) should call the shop.

3. **Bottom action bar**
   - Swap the `Reservar` / calendar item for a WhatsApp action matching the pattern in `config/clients/demo-phone-repair-shop/`.
   - The bar should show: **Call** (`tel:{{phone}}`) and **WhatsApp** (`https://wa.me/{{whatsapp}}`).

4. **Copy pass — remove booking references**
   - Remove `"Reserva online"` from `siteMetadata.defaultDescription`, `metadata.description`, and any mid-page CTA subtext.
   - Replace `{{bookingHoursWeekday}}` placeholder with `{{hours}}` in `contacto.json` and the location block.

5. **`pages/contacto.json`**
   - Verify that the contact page has no booking-specific fields or CTAs. Replace any with WhatsApp/phone equivalents.

6. **`pages/servicios.json`**
   - Change all `"ctaHref": "/#services"` or `"ctaHref": "/reservar"` values to `https://wa.me/{{whatsapp}}`.

### What must NOT change

- Do not touch `components/ServicesBlock.tsx`. It is off the demo render path and will be addressed separately. Quarantine, do not refactor.
- Do not modify any schema files in `config/schemas/`. Schema additions are Task T-B scope only.
- Do not touch `app/layout.tsx`, `lib/`, or any script files.

---

## Requirements

- [ ] Set `"booking": false` in `config/templates/cell-phone-repair-shop/template.json` and `client.json`.
- [ ] Retarget all hero and mid-page CTAs in `pages/index.json` to WhatsApp and phone.
- [ ] Fix the bottom action bar: Reservar → WhatsApp item.
- [ ] Remove all "Reserva online" copy from `siteMetadata`, `metadata.description`, and CTA subtext.
- [ ] Replace `{{bookingHoursWeekday}}` with `{{hours}}` placeholder in `contacto.json` and location block.
- [ ] Retarget `pages/servicios.json` CTAs from booking anchors to WhatsApp.
- [ ] Verify `pages/contacto.json` has no booking-specific fields.

---

## Files touched

| Area | Paths |
|---|---|
| Template config | `config/templates/cell-phone-repair-shop/template.json` (modified) |
| Client defaults | `config/templates/cell-phone-repair-shop/client.json` (modified) |
| Homepage | `config/templates/cell-phone-repair-shop/pages/index.json` (modified) |
| Services page | `config/templates/cell-phone-repair-shop/pages/servicios.json` (modified) |
| Contact page | `config/templates/cell-phone-repair-shop/pages/contacto.json` (modified) |

---

## Out of scope

- Adding a static priced services block to the homepage (that is Task T-B).
- Any changes to React components.
- Any CI or script changes.

---

## Acceptance criteria

1. `CLIENT_ID=demo-phone-repair-shop npm run build:blob` completes with exit code 0 in a clean environment (no Cosmos, no admin API URL, no booking env vars).
2. The built homepage contains no visible "Reservar" or "Reserva online" text.
3. All CTA buttons on the homepage and services page link to WhatsApp or phone, not to a booking anchor.
4. The bottom action bar shows WhatsApp and Call, not a calendar/booking item.
5. No booking-related copy appears in page `<meta>` description tags.
