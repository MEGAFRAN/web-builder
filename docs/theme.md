# Theming & Spacing

> Read this file when writing or modifying any component that uses colors, fonts, spacing, or CSS variables. See [architecture.md](../architecture.md) for the overall system.

---

## How Theming Works

Theming is pure CSS variables — no runtime JS.

1. `globals.css` defines fallback values in `:root`
2. At build time, `layout.tsx` calls `resolveTheme(config.theme)` → `buildThemeStyles(preset)` and injects:
   ```css
   :root {
     --color-primary: #c0392b;
     --color-accent: #e74c3c;
     --color-bg: #fdf8f2;
     --color-text: #2d1a0e;
     --color-surface: #ffffff;
     --color-surface-dark: #3b1c14;
     --font-heading: 'Playfair Display', serif;
     --font-body: 'Inter', sans-serif;
     --radius: 4px;
     --page-inset: clamp(1rem, 5vw, 2rem);
     --section-spacing: 5rem;
     --content-gap: 1rem;
   }
   ```
3. Components consume vars via Tailwind utilities and semantic classes (`.btn-primary`, `.text-brand`, `.section`)

**Preset resolution**: `lib/theme-presets.ts` exports `THEME_PRESETS` and `THEME_PRESET_META`. `resolveTheme(clientTheme)` merges client overrides on top of the selected preset, always returning a fully-populated `ThemePreset` with 12 required fields.

---

## Available Presets

`bold-restaurant`, `modern-minimal`, `professional-law`, `vibrant-retail`, `calm-healthcare`, `bright-education`, `modern-realestate`, `warm-hospitality`, `strong-fitness`, `creative-studio`, `community-nonprofit`, `industrial-trades`, `default`.

When selecting a preset, consult `THEME_PRESET_META` (keyed by preset name) — it exposes `industries`, `mood`, `colorTemperature`, and `formality`.

---

## Spacing Tokens

All three tokens accept two formats:
- **Raw CSS string**: `"5rem"` — injected verbatim
- **Responsive object**: `{ "mobile": "2rem", "desktop": "6rem" }` with optional `"tablet"` — resolved to a `clamp()` expression by `resolvePageInset()` in `lib/client-config.ts`

`buildThemeStyles` and `app/layout.tsx` always receive a resolved `string` and are unaware of the object format.

### `--page-inset` (horizontal padding)

- Drives all horizontal page padding via `.section` utility and `Container` (default `padding="theme"`)
- Set via `"pageInset"` in `client.json` theme object
- **Never** apply horizontal padding at layout level or directly in components — clips full-bleed section backgrounds

### `--section-spacing` (vertical rhythm)

- Controls `paddingBlock` of every `Section` component
- `paddingY` prop is a proportional multiplier: `sm` = ×0.4, `md` = ×0.6, `lg` = ×1.0, `xl` = ×1.4
- Set via `"sectionSpacing"` in `client.json`
- Defaults by preset family: spacious (`bold-restaurant`, `warm-hospitality`) → `6rem`; energetic (`strong-fitness`, `vibrant-retail`) → `4rem`; all others → `5rem`

### `--content-gap` (internal element spacing)

- Controls `gap` of every `Stack` component
- `gap` prop is a proportional multiplier: `sm` = ×0.5, `md` = ×1.0, `lg` = ×2, `xl` = ×3
- Set via `"contentGap"` in `client.json`
- All presets default to `1rem`

---

## Spacing Conventions (Component Rules)

These are hard rules — violations break cross-client consistency.

| Rule | Correct | Forbidden |
|------|---------|-----------|
| Vertical section rhythm | `<Section paddingY="lg">` | `mt-*`, `mb-*`, `my-*` on block root elements |
| Horizontal inset | `<Container padding="theme">` | `px-*`, `mx-*`, inline horizontal padding in components |
| Internal spacing | `<Stack gap="md">` | Raw `mb-*`/`mt-*` between siblings |

### Container `maxWidth` convention

| Value | Use case |
|-------|----------|
| `2xl` | Wide content sections (FeatureGrid, Testimonials, StatsBar) |
| `xl`  | Narrow content sections (Hero text, CTA, contact forms) |
| `full` | Full-bleed inner content |
