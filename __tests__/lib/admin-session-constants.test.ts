// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { ADMIN_SESSION_COOKIE } from '@/lib/admin-session-constants'

describe('admin-session-constants', () => {
  it('exports the admin session cookie name', () => {
    expect(ADMIN_SESSION_COOKIE).toBe('bp_admin_session')
  })
})
