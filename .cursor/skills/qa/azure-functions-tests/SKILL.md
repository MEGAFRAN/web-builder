---
name: azure-functions-tests
description: >-
  Creates, updates, and debugs tests for azure-functions handlers, Cosmos stores,
  Stripe helpers, and auth code using node:test or Vitest. Use when working on
  azure-functions tests, tenantSettingsStore tests, createReservation tests, or
  azure-functions npm test failures.
---

# Azure Functions Tests

Use when creating, updating, or debugging tests for code under `azure-functions/` — handlers, Cosmos stores, Stripe helpers, auth, etc.

Examples:
- "Add tests for tenantSettingsStore"
- "Test createReservation ensures booking settings"
- "Why does azure-functions npm test fail after adding a test?"

## Two test runners (do not mix)

| Runner | Location | Stack | Command |
|--------|----------|-------|---------|
| **`node:test`** | `azure-functions/src/__tests__/*.test.ts` (auth, cookies) | `node:test` + `assert` | `cd azure-functions && npm test` |
| **Vitest** | `__tests__/azure/*.test.ts` | `vitest` + `vi.mock` | `npm run test` (repo root) |

**Rule:** Vitest files live under root `__tests__/azure/` — never inside `azure-functions/src/__tests__/`. That folder is compiled by `tsc` and run with `node --test`; Vitest imports would break the build.

Root `package.json` includes `@azure/functions` and `@azure/cosmos` as devDependencies so root `tsc --noEmit` and Vitest can import handlers/stores from `azure-functions/src/` without a second CI install.

## Where tests live

```
__tests__/azure/
├── tenantSettingsStore.test.ts   # vitest — Cosmos store mocks
└── createReservation.test.ts     # vitest — handler + mocked deps

azure-functions/src/__tests__/
├── authLogin.test.ts             # node:test
├── authMe.test.ts                # node:test
├── authSession.test.ts           # node:test
└── setCookie.test.ts             # node:test
```

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

Use when testing stores or handlers that need `vi.mock` on Cosmos modules.

**Reference:** `__tests__/azure/tenantSettingsStore.test.ts`, `__tests__/azure/createReservation.test.ts`

1. Place file in `__tests__/azure/`.
2. Mock with paths relative to the test file: `../../azure-functions/src/cosmos/adminDb`.
3. Hoist mocks with `vi.hoisted(() => vi.fn())` before `vi.mock(...)`.
4. Import module under test **after** `vi.mock` blocks.
5. Import `@azure/functions` types from the root devDependency.
6. Export handlers from function files when testing handler logic (e.g. `createReservationHandler`).
7. Run from repo root:
   ```bash
   npm run test -- __tests__/azure/yourFile.test.ts
   ```

```typescript
const storeMock = vi.hoisted(() => vi.fn())

vi.mock('../../azure-functions/src/cosmos/tenantSettingsStore', () => ({
  ensureTenantBookingSettings: storeMock,
}))

import { createReservationHandler } from '../../azure-functions/src/functions/createReservation'
```

No changes to `vitest.config.ts` or `azure-functions/tsconfig.json` are needed for new Vitest Azure tests.

## TypeScript / validate pitfalls

| Issue | Cause | Fix |
|-------|-------|-----|
| `Cannot find module '@azure/functions'` or `'@azure/cosmos'` in root `tsc` | Vitest tests import `azure-functions/src/` which pulls transitive deps | Ensure both packages are in root `package.json` devDependencies |
| `node --test` fails on new test file | Vitest file placed under `azure-functions/src/__tests__/` | Move to `__tests__/azure/` |
| Stale `dist/.../your.test.js` after moving a test | Old build artifact | `rm dist/src/__tests__/your.test.js && cd azure-functions && npm run build` |

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
npm run test -- __tests__/azure/

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
