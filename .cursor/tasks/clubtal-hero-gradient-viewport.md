# Clubtal hero: brand gradient + desktop full viewport height

## Objective

Update the Clubtal homepage hero so the background is a clear brand color gradient (not a photo), and on desktop the hero fills the first viewport below the sticky navbar.

## Owner

`nextjs-frontend-developer`

## Inputs

- UX design from session (ux-ui-designer): gradient CSS values, desktop height pattern mirroring mobile
- Existing files:
  - `app/globals.css` (`.hero-bg-gradient`)
  - `components/sections/Hero.tsx`
  - `components/sections/Hero.stories.tsx`
  - `components/blocks/HomepageHeroBlock.tsx`
  - `__tests__/components/sections/Hero.test.tsx`
  - `__tests__/components/blocks/HomepageHeroBlock.test.tsx` (if present)
  - `public/clients/clubtal/clubtal-hero-background.png` (orphaned — delete)

## Expected output

### 1. Stronger gradient — `app/globals.css`

Replace `.hero-bg-gradient` with:

```css
.hero-bg-gradient {
  background-color: var(--color-bg);
  background-image: linear-gradient(
    160deg,
    var(--color-bg) 0%,
    color-mix(in srgb, var(--color-accent) 8%, var(--color-bg)) 45%,
    color-mix(in srgb, var(--color-accent) 22%, var(--color-bg)) 100%
  );
}
```

- Angle: `160deg`
- Accent-only stops at 8% / 22% (drop the mid primary stop)
- Keep using theme tokens (`--color-bg`, `--color-accent`)

### 2. Desktop full viewport — `components/sections/Hero.tsx`

- Add prop `fullViewportHeightDesktop?: boolean` (default `false`)
- Add constant:
  ```ts
  const DESKTOP_FULL_VIEWPORT_SECTION_CLASS =
    "md:min-h-[calc(100dvh-4.5rem)] md:flex md:flex-col md:justify-center";
  ```
  (Navbar sticky height on desktop is 4.5rem — same offset pattern as mobile’s `100svh-7rem`.)
- Wire into `buildSectionClassName` alongside the existing mobile class

### 3. Wire in block — `components/blocks/HomepageHeroBlock.tsx`

Pass `fullViewportHeightDesktop` hardcoded `true` (same pattern as existing `fullViewportHeightMobile`).

No schema or CMS JSON changes.

### 4. Stories & tests

- Update `Hero.stories.tsx` to cover the new prop where relevant
- Update/add unit tests for `fullViewportHeightDesktop` class application (mirror mobile tests)
- Update HomepageHeroBlock tests if they assert props

### 5. Cleanup

Delete `public/clients/clubtal/clubtal-hero-background.png` (nothing references it).

Ensure Clubtal `index.json` does **not** set a photo `backgroundImageUrl` if one was added for the WIP image path — gradient path requires no photo URL (or empty) so `gradientFallback` applies.

## Constraints

- Follow create-update-component skill: update stories after Hero edits
- Tailwind only for layout classes; keep gradient in globals.css (existing pattern)
- No `"use client"` changes unless already required
- Preserve mobile full-viewport behavior
- Subtext must remain ≥16px for contrast on darkest gradient stop (~4.7:1 AA)
- Do not change heroBlock schema unless absolutely required (design says not needed)
- Match existing code style; minimal diff

## Acceptance criteria

- [ ] Clubtal homepage hero shows accent-tinted gradient (no background photo)
- [ ] On `md+`, hero `min-height` is `calc(100dvh - 4.5rem)` and content is vertically centered
- [ ] Mobile full-viewport behavior unchanged
- [ ] Stories and unit tests updated and passing for the new prop
- [ ] Orphan PNG removed
- [ ] No schema/CMS config changes unless removing a WIP photo URL
