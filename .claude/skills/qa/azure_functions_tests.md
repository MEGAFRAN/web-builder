# Skill: azure_functions_tests

`azure_functions_tests(scope: string) returns TestFiles: tests under azure-functions/src/__tests__/`

## When to use

Use this skill when creating, updating, or debugging tests for code under `azure-functions/` — handlers, Cosmos stores, Stripe helpers, auth, etc.

Examples:
- "Add tests for tenantSettingsStore"
- "Test createReservation ensures booking settings"
- "Why does azure-functions npm test fail after adding a test?"

## Two test runners (do not mix)

| Runner | Location | Stack | Command |
|--------|----------|-------|---------|
| **`node:test`** | `azure-functions/src/__tests__/*.test.ts` (auth, cookies) | `node:test` + `assert` | `cd azure-functions && npm test` |
| **Vitest** | Same folder, Vitest-only files | `vitest` + `vi.mock` | `npm run test` (repo root) |

**Rule:** Vitest files must **not** compile into `azure-functions/dist/` — `node --test` will try to run them and fail (Vitest imports, missing globals).

Current Vitest files (explicit allow-list in root `vitest.config.ts`):
- `azure-functions/src/__tests__/tenantSettingsStore.test.ts`
- `azure-functions/src/__tests__/createReservation.test.ts`

When adding a **new Vitest** Azure test file, update **both**:
1. Root `vitest.config.ts` → `test.include` array
2. `azure-functions/tsconfig.json` → `exclude` array (keep file out of `tsc` output)

Auth / HTTP-helper tests stay on **`node:test`** and compile with the Azure package — no Vitest config changes.

## Where tests live

```
azure-functions/src/__tests__/
├── authLogin.test.ts          # node:test
├── authMe.test.ts             # node:test
├── authSession.test.ts        # node:test
├── setCookie.test.ts          # node:test
├── tenantSettingsStore.test.ts # vitest (excluded from azure tsc)
└── createReservation.test.ts   # vitest (excluded from azure tsc)
```

**Never** put Azure tests in root `__tests__/azure/` — colocate with the code they cover.

## Pattern A — `node:test` (handler smoke / early exits)

Use when the handler can be tested without heavy Cosmos mocking, or only needs early-return paths.

**Reference:** `azure-functions/src/__tests__/authLogin.test.ts`

1. Export the handler from the function file (e.g. `export async function authLoginHandler`).
2. Import handler **after** any mocks (none needed for early-exit tests).
3. Build minimal `HttpRequest` / `InvocationContext` stubs with `as unknown as HttpRequest`.
4. Use `describe` / `it` from `node:test`, assertions from `node:assert/strict`.
5. Run: `cd azure-functions && npm run test` (builds with `tsc`, then `node --test dist/src/__tests__/*.test.js`).

```typescript
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { HttpRequest, InvocationContext } from '@azure/functions'
import { authLoginHandler } from '../functions/auth/login'

function postRequest(body: unknown): HttpRequest {
  return {
    method: 'POST',
    headers: { get: () => null },
    query: new URLSearchParams(),
    params: {},
    json: async () => body,
  } as unknown as HttpRequest
}

describe('POST /auth/login', () => {
  it('returns 503 when clientId is missing', async () => {
    const res = await authLoginHandler(postRequest({}), mockContext)
    assert.equal(res.status, 503)
  })
})
```

**Do not use** `mock.module` + top-level `await import()` in this package — `tsc` targets CommonJS and this pattern breaks the build.

## Pattern B — Vitest (Cosmos / module mocks)

Use when testing stores or handlers that need `vi.mock` on `../cosmos/*` or sibling modules.

**Reference:** `azure-functions/src/__tests__/tenantSettingsStore.test.ts`, `createReservation.test.ts`

1. Place file in `azure-functions/src/__tests__/`.
2. Use **relative** mock paths (`../cosmos/adminDb`, not `../../azure-functions/...`).
3. Hoist mocks with `vi.hoisted(() => vi.fn())` before `vi.mock(...)`.
4. Import module under test **after** `vi.mock` blocks.
5. Import `@azure/functions` types directly — root `vitest.config.ts` aliases:
   `@azure/functions` → `azure-functions/node_modules/@azure/functions`
6. Export handlers from function files when testing handler logic (e.g. `createReservationHandler`).
7. Add filename to `vitest.config.ts` `include` and `azure-functions/tsconfig.json` `exclude`.
8. Run from repo root:
   ```bash
   npm run test -- azure-functions/src/__tests__/yourFile.test.ts
   ```

```typescript
const storeMock = vi.hoisted(() => vi.fn())

vi.mock('../cosmos/tenantSettingsStore', () => ({
  ensureTenantBookingSettings: storeMock,
}))

import { createReservationHandler } from '../functions/createReservation'
```

## TypeScript / validate pitfalls

| Issue | Cause | Fix |
|-------|-------|-----|
| `Cannot find module '@azure/functions'` in root `tsc` | Root project excludes `azure-functions/` | Keep Vitest Azure tests under `azure-functions/src/__tests__/`; rely on Vitest alias, not root `tsc` |
| `node --test` fails on new test file | Vitest file compiled to `dist/` | Add to `azure-functions/tsconfig.json` `exclude` |
| Vitest does not pick up new Azure test | Not in allow-list | Add path to `vitest.config.ts` `test.include` |
| Stale `dist/.../your.test.js` after exclude | Old build artifact | `rm dist/src/__tests__/your.test.js && cd azure-functions && npm run build` |

Root `npm run validate` runs root `tsc --noEmit` (excludes all of `azure-functions/`). Azure package typecheck: `cd azure-functions && npm run build`.

## Handler export convention

When a handler is registered with `app.http(...)` and needs tests, export the handler function:

```typescript
export async function createReservationHandler(request, context) { ... }

app.http('createReservation', {
  handler: createReservationHandler,
  ...
})
```

Existing exported handlers: `authLoginHandler`, `authMeHandler`, `createReservationHandler`.

## Verification checklist

After creating or updating Azure tests:

```bash
# Vitest Azure tests (from repo root)
npm run test -- azure-functions/src/__tests__/

# node:test Azure tests
cd azure-functions && npm run test

# Full repo gate
npm run validate
```

Report stderr from `@azure/functions` test mode (`Switching to test mode`) as **warnings**, not failures — expected when Vitest imports handlers.

## Decision guide

| Need | Choose |
|------|--------|
| Auth, cookie helpers, 503/400 early returns | Pattern A (`node:test`) |
| Cosmos store logic with mocked containers | Pattern B (Vitest) |
| Handler with mocked Cosmos deps | Pattern B (Vitest) + export handler |
| Full integration against real Cosmos | Out of scope — manual smoke / separate harness |
