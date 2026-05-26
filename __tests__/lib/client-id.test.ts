import { describe, it, expect, vi, afterEach } from 'vitest'
import { resolveBuildClientId } from '@/lib/client-id'

describe('resolveBuildClientId', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('prefers an explicit clientId prop', () => {
    expect(resolveBuildClientId('from-prop')).toBe('from-prop')
  })

  it('falls back to NEXT_PUBLIC_CLIENT_ID', () => {
    vi.stubEnv('NEXT_PUBLIC_CLIENT_ID', 'public-test')
    vi.stubEnv('CLIENT_ID', 'server-test')
    expect(resolveBuildClientId()).toBe('public-test')
  })

  it('falls back to CLIENT_ID when public env is unset', () => {
    vi.stubEnv('NEXT_PUBLIC_CLIENT_ID', '')
    vi.stubEnv('CLIENT_ID', 'server-test')
    expect(resolveBuildClientId()).toBe('server-test')
  })
})
