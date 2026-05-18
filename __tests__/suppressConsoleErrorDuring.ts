import { vi } from 'vitest'

/** Runs async work while swallowing `console.error` (e.g. expected handler logs in API tests). */
export async function suppressConsoleErrorDuring(fn: () => Promise<void>): Promise<void> {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
  try {
    await fn()
  } finally {
    spy.mockRestore()
  }
}
