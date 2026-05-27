# Skill: vitest_react_tests

`vitest_react_tests(requirements: string) returns TestFiles: tests under __tests__/`

## When to use

Use when creating, updating, or debugging Vitest tests for the Next.js app — components, hooks, `lib/`, `app/api/` route handlers.

Examples:
- "Add tests for BookingDetailDrawer"
- "Fix act(...) warnings in AdminShell tests"
- "ReservationCardCapture tests timeout at 5000ms"

## Location and runner

| Code | Test folder | Command |
|------|-------------|---------|
| Components, hooks, `lib/`, `app/api/` | `__tests__/` | `npm run test -- __tests__/path/to/file.test.tsx` |
| Full suite | `__tests__/` | `npm run test` |
| Lint + test + tsc | — | `npm run validate` |

Config: `vitest.config.ts`, setup: `vitest.setup.ts`, environment: `jsdom`.

## Writing tests

1. Mirror source path under `__tests__/` (e.g. `components/admin/AdminShell.tsx` → `__tests__/components/admin/AdminShell.test.tsx`).
2. Prefer integration-style tests over trivial assertions.
3. Use `it.each` for collections — never one `it()` per preset/variant unless explicitly requested.
4. Import from `@/` for app code; mock at module boundary with `vi.hoisted` + `vi.mock` before imports.
5. Reset mocks in `beforeEach`.

## React `act(...)` warnings

Treat stderr `act(...)` warnings as real issues even when Vitest exits 0.

**Cause:** `useEffect` async work (`fetch`, `adminFetch`) calls `setState` after synchronous `render()`.

**Fix:** `waitFor` / `findBy*` after render; extract a flush helper when reused.

**Reference:** `__tests__/components/admin/AdminShell.test.tsx`

```tsx
async function flushAdminShellConfig(expectedDisplayName = 'Acme Spa') {
  await waitFor(() => expect(vi.mocked(fetch)).toHaveBeenCalled())
  await waitFor(() => {
    expect(screen.getAllByText(expectedDisplayName).length).toBeGreaterThan(0)
  })
}
```

Do not suppress `act` globally or weaken assertions.

## Debounced effects and fake timers

**Symptom:** `Test timed out in 5000ms` on debounced components (e.g. `ReservationCardCapture`, 400ms debounce).

**Traps:**
1. Real debounce + `waitFor` exceeds default 5000ms suite budget.
2. Global `vi.useFakeTimers()` breaks `waitFor` unless time is advanced.

**Fix order:**
1. `describe('...', { timeout: 15_000 }, () => { ... })` when using real timers + debounce flush.
2. Prefer real timers + short flush helper over global fake timers.
3. Scope fake timers to one test with `try/finally` + `vi.useRealTimers()`.
4. After debounce, flush microtasks: `await Promise.resolve()` twice (see `ReservationCardCapture`).

**Reference:** `__tests__/components/blocks/ReservationCardCapture.test.tsx`

## Mocking third-party SDKs (Stripe, etc.)

1. Hoist mocks: `const mockLoadStripe = vi.hoisted(() => vi.fn())`
2. Mock both `@stripe/stripe-js` and `@stripe/react-stripe-js` when needed.
3. Import component **after** `vi.mock` blocks.
4. Toggle flags via mocked helpers (e.g. `isMockBookingStripe`) instead of mutating env mid-test.

## Diagnosis checklist

| Signal | Likely issue | Action |
|--------|----------------|--------|
| Fails at ~5000ms | Debounce + `waitFor` budget | Raise `describe` timeout or flush debounce |
| Hangs with fake timers | `waitFor` not advancing time | Scoped fake timers or real timers |
| `fetch` never called | Guards, mock mode, debounce not flushed | Read component; flush helper |
| `act(...)` stderr | Async setState after render | `waitFor` / flush helper |
| Wrong URL in assertion | `NEXT_PUBLIC_*` env | `vi.stubEnv` or match actual helper output |

## Verify

```bash
npm run test -- __tests__/path/to/Your.test.tsx
npm run validate
```
