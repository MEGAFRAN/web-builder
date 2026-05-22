# Task: Add tests for AdminAuthContext and admin-api.ts

**Status:** Ready for development  
**Priority:** Medium — not a deploy blocker, but AdminAuthContext is the auth foundation of the admin SPA  
**Owner:** Frontend  
**Estimated scope:** Small–medium — ~6 test cases, no new dependencies  
**Depends on:** nothing (tests run in Vitest with jsdom, no Azure required)

---

## Context

`lib/admin-auth-context.tsx` and `lib/admin-api.ts` are the two new files introduced by the admin SPA refactor. They are the entire auth foundation of the admin portal:

- `AdminAuthProvider` bootstraps the session on mount by calling `GET /auth/me`
- It reads/writes `sessionStorage` to persist session info across page refreshes
- It registers a global 401 handler that clears the session and redirects to login
- `adminFetch()` intercepts 401 responses and fires the global handler

`admin-auth-context.tsx` currently has **0% test coverage**. `admin-api.ts` has **64.7%**. Given that a bug here silently logs out all admin users or exposes session state cross-tenant, this gap should be closed.

---

## Test cases to implement

### `lib/admin-auth-context.tsx` — new file: `__tests__/lib/admin-auth-context.test.tsx`

#### Bootstrap behaviour

| # | Scenario | Expected |
|---|---|---|
| 1 | No session in `sessionStorage` on mount | `status` becomes `'unauthenticated'`; `GET /auth/me` is **not** called |
| 2 | Valid session in `sessionStorage`, `/auth/me` returns 200 `{ email, clientId }` | `status` becomes `'authenticated'`; `session` matches the response |
| 3 | Stale session in `sessionStorage`, `/auth/me` returns 401 | `status` becomes `'unauthenticated'`; `sessionStorage` is cleared |
| 4 | Valid session in `sessionStorage`, `/auth/me` throws (network error) | `status` becomes `'authenticated'` using the stored session (graceful offline fallback) |

#### `setSession` / `signOut`

| # | Scenario | Expected |
|---|---|---|
| 5 | `setSession(info)` called with a valid `AdminSessionInfo` | `sessionStorage` is written; `status` becomes `'authenticated'` |
| 6 | `signOut()` called | `POST /auth/logout` is called; `sessionStorage` is cleared; router pushes to `/admin/login` |

#### `useAdminAuth` guard

| # | Scenario | Expected |
|---|---|---|
| 7 | `useAdminAuth()` called outside `AdminAuthProvider` | Throws `'useAdminAuth must be used within AdminAuthProvider'` |

### `lib/admin-api.ts` — extend existing coverage in `__tests__/lib/admin-api.test.ts` (new file)

| # | Scenario | Expected |
|---|---|---|
| 8 | `NEXT_PUBLIC_ADMIN_API_URL` not set → `adminAuthUrl('login')` | Returns `/api/admin/auth/login` |
| 9 | `NEXT_PUBLIC_ADMIN_API_URL = 'https://fn.example.com'` → `adminAuthUrl('login')` | Returns `https://fn.example.com/auth/login` |
| 10 | `adminFetch` receives a 401 response | Calls the registered `unauthorizedHandler` once |
| 11 | `adminFetch` receives a 200 response | Does **not** call `unauthorizedHandler` |
| 12 | `adminFetch` called with no handler registered and a 401 response | Does not throw; returns the response |

---

## Implementation notes

- Use `vi.stubGlobal('fetch', vi.fn(...))` to mock `fetch` in Vitest
- Use `vi.stubGlobal('sessionStorage', ...)` or the `jsdom` built-in `sessionStorage` (already available in the test environment)
- Wrap components with `AdminAuthProvider` using a test helper; do **not** use `MemoryRouter` — the provider uses `useRouter` from Next.js, which should be mocked via `vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }))`
- Use `waitFor` from `@testing-library/react` for async bootstrap assertions (the `useEffect` + `fetch` call in `AdminAuthProvider` is async)
- Do not test the `sessionStorage` key string directly — test observable state (`status`, `session`) instead

---

## Requirements

- [ ] All 12 test cases above are implemented and passing
- [ ] `npm test` exits 0
- [ ] `admin-auth-context.tsx` branch coverage reaches ≥ 80%
- [ ] `admin-api.ts` branch coverage reaches ≥ 85%
- [ ] No new npm packages are installed — use Vitest + `@testing-library/react` already in `devDependencies`

---

## Files touched

| File | Change |
|---|---|
| `__tests__/lib/admin-auth-context.test.tsx` | New — 7 test cases |
| `__tests__/lib/admin-api.test.ts` | New — 5 test cases |

---

## Acceptance criteria

1. `npm test` passes with the new test files included
2. `npx tsc --noEmit` passes (no type errors in test files)
3. Coverage report shows `admin-auth-context.tsx` at ≥ 80% branch coverage
4. The 401 redirect test (case 3) confirms `sessionStorage` is cleared — not just that `status` changed
