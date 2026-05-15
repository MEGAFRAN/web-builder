# Skill: create_or_update_component

`create_or_update_component(requirements: string) returns UpdatedReactComponents`

## Input

- `requirements`: description of the component to create or update, including props, variants, and behavior

## Preconditions

Read before executing:
- `components/registry.ts` — verify component path and props contract
- The target component file if it already exists

## Process

### Step 1 — Write or update the component

1. Determine the correct directory by category: `components/inputs/`, `components/content/`, `components/data/`, `components/layout/`, `components/navigation/`, `components/sections/`, `components/blocks/`
2. Write or update the `.tsx` file. Follow all agent constraints (Tailwind only, no `any`, no `"use client"` unless required).
3. Export the component as a named export for primitives, or default export for blocks/sections.

### Step 2 — Write or update the Storybook story

After every component write or edit, create or update the corresponding `<ComponentName>.stories.tsx` file in the **same directory** as the component.

#### Story file rules

**Title convention** — match the directory category:
| Directory | Title prefix |
|---|---|
| `components/inputs/` | `Inputs/ComponentName` |
| `components/content/` | `Content/ComponentName` |
| `components/data/` | `Data/ComponentName` |
| `components/layout/` | `Layout/ComponentName` |
| `components/navigation/` | `Navigation/ComponentName` |
| `components/sections/` | `Sections/ComponentName` |
| `components/blocks/` | `Blocks/ComponentName` |

**Always include:**
- `tags: ['autodocs']`
- `parameters: { layout: 'fullscreen' }` for blocks and sections; omit for primitives
- `argTypes` with `control: 'select'` for any prop that accepts a fixed set of string values (variants, sizes, etc.)

**Story exports:**
- Export one named story per meaningful visual state, variant, or prop combination
- Name stories in PascalCase: `Default`, `Primary`, `WithModal`, `NoHeading`, `Disabled`, `Small`, `Large`, etc.
- Cover: the default/happy path, each named variant, any optional-prop permutation that changes the visual output

**Mock data:**
- For blocks and sections that use CMS-typed props (Service, TestimonialItem, FaqItem, etc.), import mocks from `@/stories/mocks/cms-fixtures` — do not inline large data arrays
- For primitives and layout components, use inline `args` directly
- If a required mock does not exist in `cms-fixtures.ts`, add it there following the existing export pattern

#### Story file template

```tsx
import type { Meta, StoryObj } from '@storybook/react'
import { ComponentName } from './ComponentName' // named export
// import ComponentName from './ComponentName'  // default export (blocks/sections)
// import { mockXxx } from '@/stories/mocks/cms-fixtures' // if CMS data needed

const meta = {
  title: 'Category/ComponentName',
  component: ComponentName,
  tags: ['autodocs'],
  // parameters: { layout: 'fullscreen' }, // blocks & sections only
  // argTypes: { variant: { control: 'select', options: ['a', 'b'] } },
} satisfies Meta<typeof ComponentName>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { /* minimal required props */ },
}
// ... additional stories per variant/state
```

### Step 3 — Type-check

```bash
npx tsc --noEmit 2>&1 | head -40
```

Fix any errors before reporting done.

## Output

```
Component written:  components/<category>/<ComponentName>.tsx
Story written:      components/<category>/<ComponentName>.stories.tsx
Stories exported:   Default, <Variant1>, <Variant2>, ...
Mock data added:    stories/mocks/cms-fixtures.ts (if applicable)
Type check:         passed / <N errors fixed>
```

## Failure format

```
FAILED at step <N> — <step name>
Reason: <exact error>
Suggested fix: <one-line actionable hint>
```
