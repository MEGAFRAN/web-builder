# Block System

> Read this file when adding, modifying, or validating block types and page content. See [architecture.md](../architecture.md) for the overall system. For the full agent-facing list of blocks and primitives, see [component-catalog.md](./agents/component-catalog.md) (auto-generated via `npm run generate:component-catalog`).

---

## Block Model

Pages are arrays of typed blocks. The TypeScript model is a discriminated union:

```typescript
type Block = HeroBlock | ServicesBlock | ContactBlock | BlogListBlock | ...
//           _type: 'hero' | 'services' | 'contact' | 'blog_list' | ...
```

Each block object must have a `_type` field matching a registered type string. Unknown types log a warning at build time and render nothing.

---

## Block Rendering Pipeline

```
config.pages[n].blocks[]
    │
    ▼
PageRenderer (registry lookup on block._type)
    │
    ▼
componentRegistry: Record<string, React.ComponentType>
    ├── 'hero'      → dynamic(() => import('./blocks/HeroBlock'))
    ├── 'services'  → dynamic(() => import('./blocks/ServicesBlock'))
    ├── 'contact'   → dynamic(() => import('./blocks/ContactBlock'))
    └── ...see component-catalog.md for the current list
```

Each entry uses `next/dynamic` with a static import path — no computed paths.

---

## Adding a New Block Type

1. Add the TypeScript type to the `Block` union in `types/cms.ts`
2. Create the React component under `components/blocks/`
3. Add one entry to `componentRegistry.ts`
4. Create a JSON Schema file at `config/schemas/blocks/{typeName}.schema.json`
5. Use the new `_type` value in a client's page JSON
6. Run `npm run generate:component-catalog` to refresh `docs/agents/component-catalog.md`

---

## JSON Schema Validation

Every block type has a corresponding schema under `config/schemas/blocks/`. All schemas enforce:

- `_type` as a `const` — the exact block type string, no guessing
- `"additionalProperties": false` — rejects unknown fields immediately
- Nullable fields declared explicitly with `oneOf: [{"type": "string"}, {"type": "null"}]`

**AI agents must validate output against the relevant schema before writing a page file.** The build pipeline rejects any page file that fails schema validation.

---

## Page File Format

Each page file lives at `config/clients/{clientId}/pages/{slug}.json` (or in the template's `pages/` directory). Shape:

```json
{
  "metadata": {
    "title": "Page Title",
    "description": "Meta description"
  },
  "blocks": [
    { "_type": "hero", "heading": "...", "subheading": "..." },
    { "_type": "services", "items": [...] }
  ]
}
```

- `metadata` is optional (`null` is valid)
- `blocks` is required and must be an array
- Each block must pass its schema before the build accepts it

---

## Content Layer (`lib/json-cms.ts`)

`createJSONCMSClient(pages)` is a thin in-memory wrapper — no network calls:

```typescript
createJSONCMSClient(pages: ClientPage[]) → {
  getPages()       // returns { slug: string }[]
  getPage(slug)    // returns ClientPage | null
  imageUrl(source) // passthrough — URLs must be absolute
}
```

- Image URLs in JSON must be absolute (any public CDN, Azure Blob, etc.)
- Called only during `next build` — results are baked into static HTML
- Promises are preserved on the interface so the page route is async-compatible
