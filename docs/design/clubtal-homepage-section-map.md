# Clubtal Homepage Section Map

**Author:** UX/UI Designer  
**Date:** August 4, 2026  
**Target file:** `config/clients/clubtal/pages/index.json`  
**Preset:** `clubtal-brand` (`lib/theme-presets.ts`)  
**Status:** Delivered and written to disk

---

## Context

`clubtal.com` is Clubtal's own marketing site — not a client repair shop site. Its only job is to survive a Google search after a cold WhatsApp DM and convince a Spanish micro-business owner that Clubtal is a real, credible service worth €39/mes + IVA. The prior implementation had a single `heroBlock` which read as a broken holding page. This document defines the replacement.

All `_type` values and prop names were verified against `types/cms.ts` and the corresponding `.tsx` block source files before writing.

---

## Accessibility Pre-Check — `clubtal-brand` Preset

| Color pair | Contrast ratio | WCAG 1.4.3 result |
|---|---|---|
| `#111827` text on `#ffffff` background | ~18:1 | Pass (AA + AAA) |
| `#ffffff` text on `#2563eb` button | ~5.2:1 | Pass (AA) |
| `#2563eb` links on `#ffffff` | ~5.2:1 | Pass (AA) |
| `#2563eb` links on `#f9fafb` surface | ~5.0:1 | Pass (AA) |
| `#111827` text on `#f9fafb` surface | ~17:1 | Pass |
| `#ffffff` on `#111827` dark sections | ~18:1 | Pass |

No contrast flags. The preset is safe across all standard token pairings.

Watch for `.text-muted` utility classes in any component that renders muted text — verify the resolved shade against its background at runtime.

---

## Section Map

### Section 1 — `heroBlock` (launch-critical)

**Job:** Orient the prospect in under 3 seconds. Establish what Clubtal is and who it is for. Surface the price immediately — no scroll required.

**Why `heroBlock` over `hero`:** The `hero` block (`_type: "hero"`) is a minimal single-CTA banner intended for inner pages. `heroBlock` (`_type: "heroBlock"`) is the designated homepage above-the-fold component, rendered by `HomepageHeroBlock.tsx` via the `Hero` section with `fullViewportHeightMobile` and `gradientFallback`. On a cold-traffic Android WebView (the primary surface for this page), a full-viewport-height first screen is a stronger first impression than a compact banner.

**Copy rationale:** The prior H1 "Clubtal — tu web profesional, lista hoy" repeats the navbar logo and `<title>` verbatim. The H1 of a landing page should carry the value proposition, not the brand name — the logo already handles the name. The price in `subtext` satisfies the CEO's "price always visible" rule at the first touch point without the prospect needing to scroll.

**Props used:**
- `heading` — value proposition as H1
- `subtext` — positioning line + price, rendered as body copy below the headline
- `primaryButtonLabel` / `primaryButtonHref` — demo CTA
- `backgroundImageUrl: null` — no image asset at launch; gradient fallback activates

---

### Section 2 — `featureGridBlock` (launch-critical)

**Job:** Answer the implicit question after the hero: "OK, but what exactly do I get?" Four concrete deliverables, zero abstract promises.

**Why `featureGridBlock`:** Scannable multi-column grid, best for a list of product benefits with heading + description pairs. Renders on a white background, creating visual separation from the hero. Items render correctly with `iconUrl` omitted — the demo-phone-repair-shop homepage uses this pattern without icons and is the existing production reference. On mobile the grid stacks to a single column.

**Props used:**
- `heading` — section title rendered as H2
- `items[]` — array of `{ heading, description }` objects; `iconUrl` omitted (null-safe)

---

### Section 3 — `valuesBlock` (launch-critical)

**Job:** Remove the hidden friction point "esto suena complicado." Three steps make the purchase feel risk-free and frictionless. Emoji icons require no image assets.

**Why `valuesBlock`:** `ValuesBlock.tsx` renders on a gray `Section` background (hardcoded), creating automatic visual separation from the white `featureGridBlock` above. Three-column Cards with emoji + H3 heading + description paragraph are the right weight for a process narrative — substantial enough to feel real, not so heavy that they slow the scan.

**Props used:**
- `heading` — section title rendered as H2
- `items[]` — array of `{ icon, title, description }` where `icon` is an emoji string rendered as `<span className="text-2xl">`

---

### Section 4 — `ctaBlock` with `background: "gray"` (launch-critical)

**Job:** Make the price the hero of its own section. By this point the prospect has seen the value (section 2) and understood the process (section 3). This is the commitment ask — it states the price plainly, pre-empts remaining objections in one sentence, and pushes them to the demo (evidence before commitment).

**Why `ctaBlock`:** The `headline` prop renders as an H2. Putting `39€/mes + IVA` in the headline makes the price visually prominent at heading size — the strongest typographic signal on the page for price information. The gray `background` prop continues the visual rhythm from the `valuesBlock` above while the CTA button provides the conversion call.

**Props used:**
- `headline` — price as H2
- `subtext` — objection pre-emption (no permanence, deductible, cancel any time)
- `ctaLabel` / `ctaHref` — demo link
- `background: "gray"`

---

### Section 5 — `faqBlock` (launch-critical)

**Job:** Intercept the six objections the CGO has documented before they become DM rejections. The FAQ accordion keeps all questions visible at once while progressively disclosing answers — correct UX for 6 items on mobile. Renders on a white background, separating it visually from the preceding gray sections.

**Why `faqBlock`:** The `FAQ` section component renders as an accessible accordion. Each question/answer pair is keyboard-navigable (WCAG 2.1.1) and the open/close state provides visible feedback (WCAG 2.4.7). The white section background (`Section background="white"` in `FaqBlock.tsx`) creates the correct alternating rhythm after two gray sections.

**Props used:**
- `title` — section title rendered above the accordion
- `items[]` — array of `{ question, answer }` objects

---

### Section 6 — `ctaBlock` with `background: "dark"` (launch-critical, blocked on WhatsApp number)

**Job:** The terminal conversion action. The dark background signals "final step" and creates strong contrast after the white FAQ section. At this point the prospect has read the full page. The CTA does not repeat the demo link — it sends them directly to WhatsApp to start, which is the M1 sales close mechanism.

**Copy rationale:** The pre-filled `?text=` param in the WhatsApp URL removes decision friction for the prospect (they don't have to figure out what to write). Replace `34XXXXXXXXX` with the real WhatsApp Business number before deployment.

**Props used:**
- `headline` — conversion question as H2
- `subtext` — instruction + reinforcement of same-day promise
- `ctaLabel` / `ctaHref` — WhatsApp URL with pre-filled message (placeholder number)
- `background: "dark"`

---

## Launch Priority

| Block `_type` | Priority | Condition |
|---|---|---|
| `heroBlock` | Launch-critical | Now |
| `featureGridBlock` | Launch-critical | Now |
| `valuesBlock` | Launch-critical | Now |
| `ctaBlock` (gray, price anchor) | Launch-critical | Now |
| `faqBlock` | Launch-critical | Now |
| `ctaBlock` (dark, WhatsApp close) | Launch-critical | Blocked — needs real WhatsApp Business number |
| `testimonialsBlock` | Deferred | After first 2–3 paying clients provide real quotes |
| `statsBlock` | Deferred | After real metrics exist — never invent numbers |
| `logoCloud` | Deferred | After clients with logo consent |

---

## Navbar Decision — Keep `links: []` Empty

**Rationale:** No block type in `types/cms.ts` exposes an `id` prop, so anchor links in the navbar cannot target specific sections in the rendered HTML. Broken anchor links on a credibility site are worse than no links at all. The page is six sections and scrolls in under 10 seconds on mobile.

The navbar CTA "Ver un ejemplo" → `https://moviles.clubtal.com` is the only interactive element needed in the header. Adding navigation links dilutes this CTA (Hick's Law: fewer choices reduce decision time).

**Future gap:** If anchor navigation is ever needed, each block type in `types/cms.ts` needs an optional `anchorId?: string | null` prop, and each block component needs to render `id={anchorId}` on its outermost element.

---

## Footer — Legal Column (Spanish Law Requirement)

The original footer had one column (Demo link) and a bare copyright. This is legally insufficient for any Spanish public website before it goes live.

**Legal basis:**
- **Ley 34/2002 (LSSI-CE) Art. 10** — any commercially-oriented website must display: company name, NIF/CIF, registered address, and a contact route.
- **RGPD + LOPDGDD** — a privacy policy is required if any personal data is collected, including contact form data or analytics (Cloudflare Analytics beacon is planned in the roadmap).
- **Cookie law** — a cookie notice is required if analytics tracking is present.

**What was updated in `client.json`:**
- `copyright` changed from `"© Clubtal"` to `"© 2026 Clubtal"` (year is expected by convention and avoids the page looking stale)
- "Demo" column renamed to "Clubtal" with a cleaner link label ("Ver demo")
- "Legal" column added with two links: "Aviso legal" → `/aviso-legal` and "Privacidad" → `/privacidad`

**Gap — legal pages not yet created:**
`/aviso-legal` and `/privacidad` are linked from the footer but do not exist as page JSON configs under `config/clients/clubtal/pages/`. These pages must exist before `clubtal.com` resolves publicly. They are a legal pre-condition for launch, not a design item. The founder must supply the company legal details (NIF/CIF, registered address, data controller identity) to populate them. File these as a task for the `nextjs-frontend-developer` once the founder provides the legal copy.

---

## Block Gaps Identified

### Gap 1 — `missionBlock` hardcodes `level="h1"` (medium severity)

`MissionBlock.tsx` renders `<Heading text={heading} level="h1" align="left" color="default" />` regardless of where the block appears in the page. Used after the `heroBlock` (which already renders the page's H1), it creates a second `<h1>` — a WCAG 1.3.1 (Info and Relationships) violation and a broken heading hierarchy.

**`missionBlock` is intentionally excluded from this page for this reason.**

**Fix required before it can be used mid-page:** Add `headingLevel?: 'h1' | 'h2' | 'h3'` to the `MissionBlock` type in `types/cms.ts` and use it in the component in place of the hardcoded `"h1"`. Default to `"h2"` when not provided.

### Gap 2 — No block `anchorId` prop (low severity)

Described above under Navbar Decision. No block supports an `id` attribute from page JSON configuration, making in-page anchor navigation impossible without code changes.

### Gap 3 — Legal pages `/aviso-legal` and `/privacidad` (legal pre-condition)

Described above under Footer. Not a design gap — a legal and content gap.

### Gap 4 — `featureGridBlock` icons require image URLs (low severity)

`FeatureGridItem.iconUrl` accepts a URL string, not an emoji. Items render correctly without icons when `iconUrl` is omitted (the field is optional). If icon imagery is desired in the future, SVG icon URLs must be provided. The `valuesBlock` emoji icon approach is the practical alternative for icon-like visual cues without image assets.

---

## WhatsApp Number Placeholder

The final `ctaBlock`'s `ctaHref` uses `https://wa.me/34XXXXXXXXX?text=Hola%2C%20me%20interesa%20tener%20una%20web%20para%20mi%20tienda` as a placeholder. Replace `34XXXXXXXXX` with the 11-digit Spanish mobile number (country code 34 + 9-digit number, no spaces or `+`) before the site is deployed. The pre-filled `text` param reduces friction for the prospect by removing the "what do I write?" decision.
