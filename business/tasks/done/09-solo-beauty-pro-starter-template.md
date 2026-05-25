# Task: Solo-Beauty-Pro Starter Template

**Status:** Ready for development  
**Priority:** High — milestone blocker for M1  
**Owner:** Next.js Frontend Developer  
**Estimated scope:** Small — JSON configuration files based on existing blocks  
**Depends on:** `business/tasks/11-vertical-tag-placeholder-schema.md` (Optional, schema additions can be done in parallel)

---

## Context

To enable rapid, zero-friction onboarding for our primary target vertical — solo beauty professionals — we need a dedicated starter template. Following CPO directives, this template will be composed strictly of the 8 approved blocks from our existing 27-block library (no new block types are allowed). 

Additionally, 21 out of 27 block types will be kept hidden in the default beauty template config to keep the UI clean and minimalist, reducing "dashboard sprawl".

The template will utilize placeholder keys (e.g. `{{businessName}}`, `{{ownerFirstName}}`) to allow easy string substitution during automated tenant provisioning.

---

## Template Composition

The starter template must be placed in `config/templates/solo-beauty-pro/` and contain two files:
1. `client.json`: The base client-level metadata and configuration.
2. `pages/index.json`: The homepage composition using the 8 CPO-approved blocks in order (filename `index.json` maps to slug `""` and is served at `/`):
   - `navbar` (chrome)
   - `heroBlock`
   - `services`
   - `reservationBlock`
   - `testimonialsBlock`
   - `location`
   - `contactInfoBlock`
   - `footer` (chrome)

*Note: In the static compilation step, `navbar` and `footer` are the top/bottom chrome layout components, and the other 6 blocks represent the core content of the homepage.*

---

## Placeholders for Substitution

The following placeholders must be embedded in the placeholder content within `client.json` and `pages/index.json` for variable replacement during provisioning:
- `{{businessName}}` (e.g., "Sally's Styling Studio")
- `{{ownerFirstName}}` (e.g., "Sally")
- `{{primaryService}}` (e.g., "Hair Styling & Coloring")
- `{{address}}` (e.g., "123 Main St, Madrid")
- `{{phone}}` (e.g., "+34 600 000 000")
- `{{bookingHoursWeekday}}` (e.g., "9:00 AM - 7:00 PM")

---

## Requirements

### 1. Structure & Schema Validation
- [ ] Create directory `config/templates/solo-beauty-pro/` and sub-directory `config/templates/solo-beauty-pro/pages/`.
- [ ] Create `config/templates/solo-beauty-pro/client.json` matching the `client.schema.json` structure.
  - Set default theme parameters optimized for beauty salons (e.g. warm, pastel, or elegant rose/gold/emerald colors).
  - Explicitly restrict/enable feature flags (e.g., `booking: true`, `blog: false`, etc.).
- [ ] Create `config/templates/solo-beauty-pro/pages/index.json` representing the homepage block sequence.
  - Correctly structure the 8 blocks with appropriate default types (`_type: "heroBlock"`, etc.).
  - Embed the placeholder double-curly-braces strings into the text fields.

### 2. Validation Testing
- [ ] Ensure that the files validate cleanly against the corresponding JSON schemas under `config/schemas/` (using a script or schema validation test).
- [ ] Confirm no new block schemas are introduced.

---

## Files touched

| Area | Paths |
|---|---|
| Starter Template | `config/templates/solo-beauty-pro/client.json` (new) <br> `config/templates/solo-beauty-pro/pages/index.json` (new) |

---

## Out of scope

- Creating custom CSS files (use utility Tailwind configurations or global CSS variables already defined).
- Building any editor UI features to manage templates.

---

## Acceptance criteria

1. The template files `config/templates/solo-beauty-pro/client.json` and `config/templates/solo-beauty-pro/pages/index.json` exist.
2. Both files validate fully against `config/schemas/client.schema.json` and their respective block schemas.
3. No block other than the 8 approved types (`navbar`, `heroBlock`, `services`, `reservationBlock`, `testimonialsBlock`, `location`, `contactInfoBlock`, `footer`) is used in `index.json`.
4. Placeholder variables are correctly set up and easy to locate for regex substitution tools.
