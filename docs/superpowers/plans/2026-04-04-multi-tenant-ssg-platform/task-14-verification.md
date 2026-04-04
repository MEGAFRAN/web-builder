# Task 14: Full Verification

**Plan:** Multi-Tenant SSG Platform  
**Depends on:** Tasks 01–13 (everything must be implemented)  
**Goal:** Confirm the full test suite passes, TypeScript reports no errors, and a local build produces a valid static export for one client.

---

- [ ] **Step 1: Run all tests**

```bash
npm test
```

Expected output (all tasks completed):

```
✓ __tests__/smoke.test.tsx (1)
✓ __tests__/lib/sanity-image-loader.test.ts (2)
✓ __tests__/types/cms.test.ts (2)
✓ __tests__/lib/client-config.test.ts (3)
✓ __tests__/lib/cms.test.ts (4)
✓ __tests__/components/blocks/HeroBlock.test.tsx (4)
✓ __tests__/components/blocks/ServicesBlock.test.tsx (3)
✓ __tests__/components/blocks/ContactBlock.test.tsx (5)
✓ __tests__/components/blocks/BlogListBlock.test.tsx (2)
✓ __tests__/components/PageRenderer.test.tsx (6)
✓ __tests__/app/layout.test.tsx (1)
✓ __tests__/app/slug-page.test.ts (1)

Test Files  12 passed
Tests       34 passed
```

If any test fails, fix it before continuing.

- [ ] **Step 2: Run TypeScript type check**

```bash
npx tsc --noEmit
```

Expected: No output (zero type errors).

If errors appear, fix them — common causes:
- Missing return type annotation
- Mismatch between type exported from `types/cms.ts` and how it's used in a component
- `process.env.CLIENT_ID!` being called in a context that TypeScript can't resolve

- [ ] **Step 3: Run a local build for one client**

```bash
CLIENT_ID=restaurante-pepe SANITY_PROJECT_ID=your-actual-project-id npm run build
```

Expected:
- Build completes without errors
- `out/` directory is created
- `out/index.html` exists (root page from `slug = []`)
- `out/about/index.html` exists (if `about` is returned by `getPages`)

If Sanity is not yet set up with real data, temporarily hardcode `getPages` to return test slugs in `lib/cms.ts`, verify the build, then revert.

- [ ] **Step 4: Verify the `out/` directory structure**

```bash
find out -name "*.html" | sort
```

Expected: One HTML file per slug returned by `generateStaticParams`.

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "chore: verify full test suite and type check pass"
```
