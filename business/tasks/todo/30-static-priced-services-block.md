# Task: Static Priced Services Block on Homepage (T-B)

**Status:** Ready for development
**Priority:** Critical — blocks the entire demo pipeline
**Owner:** nextjs-frontend-developer
**Estimated scope:** Small-Medium — 2 hours
**Depends on:** `business/tasks/todo/29-template-surgery-repair-shop.md` (T-A)
**Milestone:** M0 (Week 1)
**Source:** `docs/meetings/summaries/2026-07-24-pivot-mobile-repair-shops-spain.md`

---

## Context

The current `pages/index.json` template for `cell-phone-repair-shop` has a `services` block with **no `items` array**. It depends entirely on a live `/api/booking-services` backend catalog. With no backend (static-only pivot), the services section renders completely blank — which means the homepage's most valuable content (what repairs they do and at what price) is invisible to every prospect who opens their demo site.

This task replaces the catalog-dependent block on the homepage with a **static priced services block** that hardcodes 5–6 representative repair services with euro prices. The `pages/servicios.json` full services page is already 100% static (`servicesPageBlock` with hardcoded cards) — this task brings the homepage into the same state.

The value proposition for repair shops is exactly "here are my services and prices." A blank services section defeats the entire product.

---

## Technical Specifications

### Static services block content

Replace the catalog-dependent `services` block in `config/templates/cell-phone-repair-shop/pages/index.json` with a static block containing these 5 repair services (with placeholder prices and Spanish copy):

| Service | Price placeholder | Description |
|---|---|---|
| Cambio de pantalla | Desde {{price_pantalla}}€ | Sustitución de pantalla rota o con fallos táctiles. |
| Cambio de batería | Desde {{price_bateria}}€ | Batería nueva con garantía. Recupera la autonomía original. |
| Puerto de carga | Desde {{price_carga}}€ | Reparación o sustitución del conector de carga. |
| Daños por agua | Consultar precio | Limpieza y restauración tras contacto con líquidos. |
| Desbloqueo / Software | Desde {{price_software}}€ | Desbloqueo de red, recuperación de sistema y actualizaciones. |
| Accesorios y fundas | En tienda | Fundas, protectores de pantalla, cargadores y más. |

Prices use placeholder variables (`{{price_pantalla}}`, etc.) populated by `generate-demos.mjs` from the scraper CSV, or fall back to a sensible default string like `"Desde 39€"` when the field is missing.

### Block structure requirements

- Use an existing static block type that supports a title, a short description, and a CTA per item. `servicesPageBlock` style is correct.
- Each item's CTA must link to `https://wa.me/{{whatsapp}}` with a label like "Pedir presupuesto" — not to a booking anchor.
- The block must render correctly with a completely empty environment (no API calls, no dynamic imports beyond what Next.js handles at build time).
- Spanish copy throughout. No English fallbacks.

### Schema additions (additive only)

If `{{price_*}}` placeholders require new fields in `config/schemas/client.schema.json`, add them as **optional** fields with string type. No breaking changes to any existing field. Follow the additive-only rule established in Task 11.

New optional client fields (if needed):
```json
"price_pantalla": { "type": "string" },
"price_bateria": { "type": "string" },
"price_carga": { "type": "string" },
"price_software": { "type": "string" }
```

---

## Requirements

- [ ] Delete the catalog-dependent `services` block from `config/templates/cell-phone-repair-shop/pages/index.json`.
- [ ] Add a static block with 5–6 hardcoded repair services, placeholder euro prices, and WhatsApp CTAs.
- [ ] All copy is in Spanish. No English.
- [ ] Each item's CTA links to `https://wa.me/{{whatsapp}}`, not a booking anchor.
- [ ] If new price placeholder fields are added to `client.schema.json`, they are optional with string type.
- [ ] The block renders with no backend, no env vars, and no API calls.
- [ ] `config/clients/demo-phone-repair-shop/client.json` is updated with default price values if the new schema fields are added.

---

## Files touched

| Area | Paths |
|---|---|
| Homepage | `config/templates/cell-phone-repair-shop/pages/index.json` (modified) |
| Client schema | `config/schemas/client.schema.json` (modified — additive only) |
| Demo client config | `config/clients/demo-phone-repair-shop/client.json` (modified — add price defaults) |

---

## Out of scope

- Modifying `components/ServicesBlock.tsx` or any other React component.
- Adding new block types to `components/componentRegistry.ts`.
- Changing `pages/servicios.json` — it is already static.

---

## Acceptance criteria

1. `CLIENT_ID=demo-phone-repair-shop npm run build:blob` with a completely empty environment produces a homepage where the services section is **visible and populated** (not blank).
2. Each service card shows a name, a description, a price (placeholder or default), and a "Pedir presupuesto" CTA linking to WhatsApp.
3. No "Reservar" or booking anchor appears in the services section.
4. All copy is in Spanish.
5. `npm run validate` passes with no schema errors.
