import { describe, it, expect } from 'vitest'
import { ADMIN_SESSION_COOKIE } from '@/lib/admin-session-constants'

describe('admin-session-constants', () => {
  it('exports the admin JWT cookie name', () => {
    expect(ADMIN_SESSION_COOKIE).toBe('admin-session')
  })
})
