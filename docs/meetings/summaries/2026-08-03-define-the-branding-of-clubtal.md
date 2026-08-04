# Meeting Summary: Define the Branding of Clubtal
Date: 2026-08-03
Agents present: ceo, cpo, cgo, ux-ui-designer
Topic: define the branding of clubtal

## Agent Key Points

**CEO:**
- Branding must maximize reply rate and prove credibility in <3 seconds of a cold DM.
- Lock brand as a "trust-and-speed utility".
- Name and descriptor are inseparable: "Clubtal — tu web profesional, lista hoy".
- Positioning is concrete, direct, and slightly boring: "La web profesional para tu tienda, sin agencia y sin complicaciones — 39€/mes + IVA."
- Visual identity must be near-free, agent-reproducible (theme tokens). No "Powered by Clubtal" badge.

**CPO:**
- Agreed with CEO on positioning and descriptor.
- Established two-identity separation via `lib/theme-presets.ts`: `clubtal-brand` (platform) vs `repair-shop-es` (clients/demo).
- Flagged that `clubtal.com` being a parked domain is a P0 conversion blocker.
- Corrected outdated `demo.clubtal.com` references to `moviles.clubtal.com` in pricing docs.

**CGO:**
- Highlighted tension: Do not put the price in the very first line of the cold DM. Lead with credibility, send demo link, *then* confirm price.
- Highlighted tension: `moviles.clubtal.com` (demo) is the primary conversion surface. `clubtal.com` is just search insurance.
- Openers must use: "me llamo [Nombre], de Clubtal".
- Monthly stats messages will seed the referral phrase.

**UX-UI-Designer:**
- Advised reducing border radius for `repair-shop-es` from 8 to 4 to look less "startup" and more "local trade business".
- Warned that amber (`#f59e0b`) fails WCAG 1.4.3 with white text; must use dark text (`#0f172a`) on amber CTAs.
- Noted that demo links will open in WhatsApp's in-app browser, so they require Android WebView QA.
- Flagged missing context: does the demo hero use a specific business name or a generic placeholder?

## Full Meeting Summary

### Decisions / recommendations
- **Brand Name:** Always use "Clubtal — tu web profesional, lista hoy".
- **Tone & Voice:** Direct, concrete, tuteo (Castilian Spanish), no superlatives.
- **Visual tokens:** `clubtal-brand` uses `#111827` primary and `#2563eb` accent. `repair-shop-es` uses 4px border radius and dark text on amber buttons.
- **Client Sites:** No "Powered by Clubtal" badge.
- **Outreach Strategy:** DM openers use personal names and delay the 39€/mes price until the prospect is anchored by the demo link.

### Points of alignment
- The descriptor is mandatory and inseparable from the coined name.
- Platform brand (Clubtal) must be completely invisible on client sites to preserve their credibility.
- Branding is a conversion and trust tool, not an aesthetic exercise.
- Implementation relies on theme tokens (`lib/theme-presets.ts`).

### Unresolved tensions or open questions
- Does `clubtal.com` resolve to anything today? (If parked, this is a P0 blocker for outreach).
- Does the hero block on `moviles.clubtal.com` use a specific business name or a generic placeholder? (Crucial for conversion).
- Who explicitly commits the two hex values for Clubtal's brand? (Defaults proposed by CPO are currently assumed).

### Suggested next actions

**Engineering Task List**
1. Update the `repair-shop-es` preset in `lib/theme-presets.ts` to use a border radius of 4 and dark text on amber CTAs. (Owner: nextjs-frontend-developer)
2. Build and deploy a single-page static site for `clubtal.com` using the `clubtal-brand` preset. (Owner: nextjs-frontend-developer)
3. QA the `moviles.clubtal.com` site in Android WebView (WhatsApp in-app browser) to ensure it renders correctly. (Owner: devops)
4. Verify and update the hero block on `moviles.clubtal.com` to use a specific, realistic business name rather than a generic placeholder. (Owner: nextjs-frontend-developer)

**Founder Actions (Not delegated to agents)**
- Update WhatsApp Business profile name to exactly "Clubtal — tu web profesional, lista hoy".
- Answer open questions regarding `clubtal.com` domain status.