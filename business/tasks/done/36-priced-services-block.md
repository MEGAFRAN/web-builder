# Task 36 — Dedicated Priced Services Homepage Block

**Status:** Ready for development
**Priority:** High — resolves registry architectural mismatch and eliminates homepage breadcrumb leak
**Owner:** nextjs-frontend-developer
**Estimated scope:** Medium — 2 hours
**Execution order:** 1 of 1
**Depends on:** `business/tasks/done/30-static-priced-services-block.md`
**Next task:** None
**Milestone:** M0 (Week 1)
**Source:** UX session — Proposal 2 (pricedServicesBlock)

---

## Context

In Task 30, the blank catalog-dependent homepage services section was replaced by reusing `servicesPageBlock`. While this succeeded in making the homepage static and populated for demo sites, `servicesPageBlock` is a full-page layout component that unconditionally renders page-level chrome: a breadcrumb (`Inicio / Servicios`), a section hero, an embedded FAQ, and a bottom CTA section.

This creates an architectural mismatch in the component registry and causes visual defect #2 (a subpage breadcrumb rendering mid-homepage).

This task implements **Proposal 2**: creating a dedicated, lightweight `pricedServicesBlock` section component specifically designed for homepages and landing pages. It separates full-page layouts (`servicesPageBlock`) from section-level blocks (`pricedServicesBlock`), removes unwanted subpage chrome from the homepage, and updates template and client configurations accordingly.

---

## Technical Specifications

### 1. JSON Schema & CMS Types

- **New block schema:** Create `config/schemas/blocks/pricedServicesBlock.schema.json`.
  - Allowed `_type`: `"pricedServicesBlock"`
  - `heading` (optional string)
  - `subtext` (optional string)
  - `deliverablesLabel` (optional string, e.g. `"Precio:"`)
  - `viewAllLabel` (optional string, e.g. `"Ver todos los servicios y precios"`)
  - `viewAllHref` (optional string, e.g. `"/servicios"`)
  - `serviceCards` (array of objects):
    - `title` (string)
    - `description` (string)
    - `deliverables` (array of strings, e.g. `["{{price_pantalla}}"]`)
    - `ctaLabel` (optional string, e.g. `"Pedir presupuesto"`)
    - `ctaHref` (optional string, e.g. `"https://wa.me/{{whatsapp}}"`)
  - `placeholderCopy` (optional object)
- **Client Schema:** Register `$ref: "./blocks/pricedServicesBlock.schema.json"` in `config/schemas/client.schema.json` under the blocks union.
- **TypeScript Types:** Add `PricedServicesBlock` definition to `types/cms.ts` and include it in the `Block` union.

### 2. Component Implementation & Registry

- **Component:** Create `components/blocks/PricedServicesBlock.tsx`.
  - Renders a clean section with `<Section>` and `<Container>`.
  - Renders `heading` and `subtext` if provided.
  - Renders a grid of service cards (title, description, price/deliverables badge, WhatsApp CTA).
  - Renders an optional "Ver todos los servicios →" link at the bottom pointing to `viewAllHref`.
  - **Does NOT render:** breadcrumbs, hero banners, embedded section FAQs, or bottom CTA blocks.
- **Dynamic Import Registry:** Register `pricedServicesBlock` in `components/componentRegistry.ts`:
  ```ts
  pricedServicesBlock: dynamic(() => import('@/components/blocks/PricedServicesBlock'))
  ```
- **Component Affordances:** Add entry for `pricedServicesBlock` in `config/component-affordances.json`:
  - `useCases`: `["Homepage or landing page grid showing key services with price tags and direct WhatsApp CTAs.", "Compact service overview section with optional link to full /servicios page."]`
  - `avoidWhen`: `["Full-page standalone services catalog with category filters and FAQs — use servicesPageBlock on subpages instead."]`
- **Storybook / Tests:** Add `components/blocks/PricedServicesBlock.stories.tsx` or unit tests covering component rendering.

### 3. Template & Client Configuration Migration

- Update `config/templates/cell-phone-repair-shop/pages/index.json`:
  - Replace `servicesPageBlock` with `pricedServicesBlock`.
  - Include 5–6 repair cards (`Cambio de pantalla`, `Cambio de batería`, `Puerto de carga`, `Daños por agua`, `Desbloqueo / Software`, `Accesorios y fundas`).
  - Include `viewAllLabel: "Ver todos los servicios y precios →"` and `viewAllHref: "/servicios"`.
- Update `config/clients/demo-phone-repair-shop/pages/index.json`:
  - Match template structure using demo values.

---

## Requirements

- [ ] Create `config/schemas/blocks/pricedServicesBlock.schema.json` and register in `client.schema.json`.
- [ ] Add `PricedServicesBlock` type in `types/cms.ts`.
- [ ] Create `components/blocks/PricedServicesBlock.tsx`.
- [ ] Register `pricedServicesBlock` in `components/componentRegistry.ts` and `config/component-affordances.json`.
- [ ] Add Storybook story or test for `PricedServicesBlock`.
- [ ] Update `config/templates/cell-phone-repair-shop/pages/index.json` to use `pricedServicesBlock`.
- [ ] Update `config/clients/demo-phone-repair-shop/pages/index.json` to use `pricedServicesBlock`.
- [ ] Verify homepage no longer renders breadcrumbs, secondary heroes, or embedded FAQs.
- [ ] Verify `npm run validate` and `npm run validate:client` pass with zero errors.
- [ ] Verify `CLIENT_ID=demo-phone-repair-shop npm run build:blob` completes successfully.

---

## Files touched

| Area | Paths |
|---|---|
| Schemas | `config/schemas/blocks/pricedServicesBlock.schema.json` (new)<br>`config/schemas/client.schema.json` (modified) |
| Types | `types/cms.ts` (modified) |
| Component | `components/blocks/PricedServicesBlock.tsx` (new)<br>`components/blocks/PricedServicesBlock.stories.tsx` (new) |
| Registry | `components/componentRegistry.ts` (modified)<br>`config/component-affordances.json` (modified) |
| Templates & Clients | `config/templates/cell-phone-repair-shop/pages/index.json` (modified)<br>`config/clients/demo-phone-repair-shop/pages/index.json` (modified) |

---

## Out of scope

- Modifying `components/blocks/ServicesPageBlock.tsx` or `pages/servicios.json`.
- Modifying booking API handlers or dynamic catalog components.

---

## Acceptance criteria

1. The homepage of `demo-phone-repair-shop` displays a clean, dedicated service price section without any `Inicio / Servicios` breadcrumb or double hero.
2. The homepage contains a "Ver todos los servicios y precios →" link pointing to `/servicios`.
3. `/servicios` remains intact as the full standalone catalog page using `servicesPageBlock`.
4. `npm run validate` and `npm run validate:client` pass with 0 schema/type errors.
5. `CLIENT_ID=demo-phone-repair-shop npm run build:blob` completes cleanly.
