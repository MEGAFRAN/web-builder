# Clubtal Brand Definition

**Status:** Locked — August 3, 2026  
**Owner:** CEO (positioning) + CPO (token propagation)  
**Do not change without CEO sign-off**

---

## Name + Descriptor (inseparable)

**Clubtal — *tu web profesional, lista hoy***

The name is coined and carries zero meaning on arrival. The descriptor does 100% of the explaining. These two strings always travel together in every external surface — WhatsApp Business name, `clubtal.com` header, invoice sender name, DM opener. They are never separated.

---

## One-Line Positioning

> La web profesional para tu tienda, sin agencia y sin complicaciones — 39€/mes + IVA.

This is not a tagline. It is the first sentence of any surface where a prospect is deciding whether to trust us.

---

## Voice Rules

| Rule | Correct | Incorrect |
|---|---|---|
| Register | Tuteo (tú, te, tu) | Usted |
| Language | Castilian Spanish only | No Catalan, English, or mixed |
| Numbers | 39€/mes + IVA always visible | No vague "precio asequible" |
| Adjectives | None beyond factual | No "innovador", "transformador", "digital" |
| Emoji | At most one per DM/message | No emoji strings |
| Tone | Directo, concreto, cercano pero profesional | No agency-speak, no startup vocabulary |
| Mental model | "Un servicio que contratas como el móvil" | Never "una plataforma" or "solución" |

**What we sound like:** a local service you subscribe to at a flat price, not an agency or a startup.  
**What we must never sound like:** a marketing consultancy, a marketplace, or a SaaS startup.

---

## Visual Identity

### Typeface

**Inter** — Google Fonts, zero licensing cost, agent-reproducible, professional without reading as a creative agency. Single typeface for all Clubtal-owned surfaces.

- Headings: Inter Semibold (600)
- Body: Inter Regular (400)
- No additional typeface imports on Clubtal-owned surfaces

### Color Tokens (Clubtal brand — do not use on client sites)

Expressed as the `clubtal-brand` theme preset in `lib/theme-presets.ts`.

| Token | Value | Use |
|---|---|---|
| `primaryColor` | `#111827` | Wordmark, headings, primary buttons |
| `accentColor` | `#2563eb` | Links, hover states, active indicators |
| `backgroundColor` | `#ffffff` | Page background |
| `textColor` | `#111827` | Body text |
| `surfaceColor` | `#f9fafb` | Cards, section backgrounds |
| `surfaceDark` | `#111827` | Dark footer, inverted sections |

**Rationale:** Near-neutral primary (`#111827`) reads as a utility tool, not a creative agency. Blue accent (`#2563eb`) is trustworthy and conventional — it does not compete with any client site's identity. This palette is deliberately plain. The most brand-differentiating act is printing `39€/mes + IVA` in plain text, not picking a distinctive color.

### Wordmark

`clubtal` in Inter Semibold, lowercase, `primaryColor` (`#111827`). No custom logo file. No SVG commission. An agent can render this in HTML/CSS without image assets.

---

## Surfaces Checklist

Every Clubtal-owned surface that a prospect can reach must be consistent before the first demo link is sent.

| Surface | Status check | Required elements |
|---|---|---|
| **WhatsApp Business profile** | Name: `Clubtal — tu web profesional, lista hoy` · Profile photo: wordmark on white | Name + descriptor · Website: `clubtal.com` |
| **`clubtal.com`** | Must resolve (not parked) before first DM | Name + descriptor · positioning line · `39€/mes + IVA` · link to `moviles.clubtal.com` · no booking/admin copy |
| **`moviles.clubtal.com`** | Demo site live | Client-facing repair shop demo — uses `repair-shop-es` preset, not `clubtal-brand` |
| **Invoice** | Sender name: `Clubtal` · footer: `clubtal.com` | VAT-compliant (Holded/Billin/Quaderno) · line item: "Web profesional mensual — 39€ + 21% IVA" |

---

## What Clubtal Is Not On Client Sites

- No "Powered by Clubtal" badge in M1. It cheapens the client's credibility — the thing they are paying us for.
- Client sites inherit the **client's brand** (their name, their colors, their contact info). Clubtal is invisible.
- Revisit co-branding attribution only if referral data justifies it (earliest: week 12 review).

---

## Separation of Identities

Two distinct visual identities. Never share tokens between them.

| Identity | Where used | Theme preset |
|---|---|---|
| Clubtal brand | `clubtal.com`, invoices, WhatsApp Business | `clubtal-brand` |
| Repair shop vertical | `moviles.clubtal.com`, all repair shop client sites | `repair-shop-es` |

---

## Open Issue (P0 blocker)

**`clubtal.com` root:** The roadmap confirms the domain is owned. Current live state unknown. If it is a parked domain, it is the highest-priority brand fix — it blocks outreach conversion regardless of any other brand work. Engineering task: deploy a one-page static site to SWA using the `clubtal-brand` preset before the first demo link goes out.

---

## Constraints

- Price always visible on every Clubtal-owned surface that a prospect can reach
- No descriptors, taglines, or campaign copy that are not derived from the positioning line above
- No brand changes without CEO sign-off
- Token values are source of truth in `lib/theme-presets.ts` — the markdown values above are documentation only; the preset file governs
