# Adding a CMS block (agent guide)

> For the full live inventory and **when to use** each block, see [component-catalog.md](./component-catalog.md) (auto-generated) and edit **`config/component-affordances.json`** for use-case copy. For page JSON rules and validation, see [blocks.md](../blocks.md).

This guide is for **non-CTO developer agents** adding a new tenant page block. Do not change core platform wiring unless explicitly assigned.

---

## Agent references (read first)

| Resource | Purpose |
|----------|---------|
| [component-catalog.md](./component-catalog.md) | All `_type` values, component paths, schema paths, affordances |
| [config/component-affordances.json](../../config/component-affordances.json) | **Use when** / **Avoid when** for blocks and primitives |
| [blocks.md](../blocks.md) | Page JSON format, schema rules, rendering pipeline |
| [architecture.md](../../architecture.md) | System overview |

After any change below, run:

```bash
npm run generate:component-catalog
npm run validate:quick
```

---

## Files you may edit

| # | File | What to do |
|---|------|------------|
| 1 | `components/blocks/YourBlock.tsx` | Default-export React block component |
| 2 | `types/cms.ts` | Export `YourBlock` type with `_type: 'yourBlock'` and add to `Block` union |
| 3 | `components/componentRegistry.ts` | One `yourBlock: dynamic(() => import('...'))` entry |
| 4 | `config/schemas/blocks/yourBlock.schema.json` | JSON Schema with `_type` const — **required** (CI fails without it) |
| 5 | `config/component-affordances.json` | `blocks.yourBlock.useCases` (≥1 bullet), optional `avoidWhen` |

Optional but recommended: `components/blocks/YourBlock.stories.tsx` for Storybook.

---

## Files you must not edit

Unless a human CTO explicitly instructs otherwise:

| Path | Reason |
|------|--------|
| `app/layout.tsx` | Global layout |
| `lib/client-config.ts` | Core config parser |
| `scripts/*` | Build/deploy tooling (catalog generator lives here — do not modify) |
| `components/PageRenderer.tsx` | Block dispatch is registry-driven |
| `docs/agents/component-catalog.md` | Generated — edit affordances and re-run generate |

---

## Worked example: `announcementBanner` (illustrative only)

The following block is **not** in the repo; it shows the exact shape of each file.

### 1. React component — `components/blocks/AnnouncementBannerBlock.tsx`

```tsx
import type { AnnouncementBannerBlock as AnnouncementBannerBlockType } from '@/types/cms'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { Heading } from '@/components/content/Heading'
import { Text } from '@/components/content/Text'

export default function AnnouncementBannerBlock({
  message,
  variant,
}: AnnouncementBannerBlockType) {
  const bg = variant === 'promo' ? 'gray' : 'white'
  return (
    <div data-component="announcement-banner-block">
      <Section background={bg} paddingY="sm">
        <Container maxWidth="2xl" padding="md">
          <Heading content="Notice" level={3} />
          <Text content={message} size="base" />
        </Container>
      </Section>
    </div>
  )
}
```

### 2. TypeScript — excerpt from `types/cms.ts`

```typescript
export type AnnouncementBannerBlock = {
  _type: 'announcementBanner'
  message: string
  variant?: 'info' | 'promo' | null
}

// In export type Block = ...
//   | AnnouncementBannerBlock
```

### 3. Registry — excerpt from `components/componentRegistry.ts`

```typescript
announcementBanner: dynamic(() =>
  import('@/components/blocks/AnnouncementBannerBlock'),
),
```

### 4. JSON Schema — `config/schemas/blocks/announcementBanner.schema.json`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "announcementBanner",
  "type": "object",
  "additionalProperties": false,
  "required": ["_type", "message"],
  "properties": {
    "_type": { "type": "string", "const": "announcementBanner" },
    "message": { "type": "string" },
    "variant": {
      "oneOf": [
        { "type": "string", "enum": ["info", "promo"] },
        { "type": "null" }
      ]
    }
  }
}
```

### 5. Affordances — excerpt from `config/component-affordances.json`

```json
{
  "blocks": {
    "announcementBanner": {
      "useCases": [
        "Short site-wide or page-level notice (hours change, promo, maintenance).",
        "Placed below navbar on homepage or booking page."
      ],
      "avoidWhen": ["Long-form content — use hero or missionBlock."]
    }
  }
}
```

### 6. Page JSON usage

```json
{
  "blocks": [
    {
      "_type": "announcementBanner",
      "message": "We are closed Monday for the holiday.",
      "variant": "info"
    }
  ]
}
```

Validate page JSON against the schema before committing client config.

---

## Contract tests (CI)

`__tests__/components/component-catalog-contract.test.ts` enforces:

- Every registry `_type` has a component file, `types/cms.ts` entry, affordances, and **JSON schema**
- Every schema’s `_type` const is registered
- Orphan or invalid schemas fail the build

Registering a block **without** a schema causes:

```text
Component catalog contract failed:
  - Registry block "yourBlock" has no JSON schema in config/schemas/blocks/ ...
```

---

## Checklist

- [ ] `components/blocks/*.tsx` created
- [ ] `types/cms.ts` type + `Block` union
- [ ] `componentRegistry.ts` entry
- [ ] `config/schemas/blocks/*.schema.json` with matching `_type` const
- [ ] `config/component-affordances.json` entry
- [ ] `npm run generate:component-catalog`
- [ ] `npm run validate:quick` passes
