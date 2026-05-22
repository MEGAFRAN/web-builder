import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('admin-api', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  describe('adminAuthUrl', () => {
    it('returns the local Next.js route when NEXT_PUBLIC_ADMIN_API_URL is not set', async () => {
      vi.stubEnv('NEXT_PUBLIC_ADMIN_API_URL', '')
      const { adminAuthUrl } = await import('@/lib/admin-api')

      expect(adminAuthUrl('login')).toBe('/api/admin/auth/login')
    })

    it('returns the local Next.js route when NEXT_PUBLIC_ADMIN_API_URL is undefined', async () => {
      vi.unstubAllEnvs()
      delete process.env.NEXT_PUBLIC_ADMIN_API_URL
      const { adminAuthUrl, isRemoteAdminApi } = await import('@/lib/admin-api')

      expect(isRemoteAdminApi()).toBe(false)
      expect(adminAuthUrl('me')).toBe('/api/admin/auth/me')
    })

    it('returns the remote Azure Functions URL when NEXT_PUBLIC_ADMIN_API_URL is set', async () => {
      vi.stubEnv('NEXT_PUBLIC_ADMIN_API_URL', 'https://fn.example.com')
      const { adminAuthUrl } = await import('@/lib/admin-api')

      expect(adminAuthUrl('login')).toBe('https://fn.example.com/auth/login')
    })

    it('strips a trailing slash from NEXT_PUBLIC_ADMIN_API_URL', async () => {
      vi.stubEnv('NEXT_PUBLIC_ADMIN_API_URL', 'https://fn.example.com/')
      const { adminAuthUrl } = await import('@/lib/admin-api')

      expect(adminAuthUrl('logout')).toBe('https://fn.example.com/auth/logout')
    })
  })

  describe('isRemoteAdminApi', () => {
    it('returns false when NEXT_PUBLIC_ADMIN_API_URL is not set', async () => {
      vi.stubEnv('NEXT_PUBLIC_ADMIN_API_URL', '')
      const { isRemoteAdminApi } = await import('@/lib/admin-api')

      expect(isRemoteAdminApi()).toBe(false)
    })

    it('returns true when NEXT_PUBLIC_ADMIN_API_URL is set', async () => {
      vi.stubEnv('NEXT_PUBLIC_ADMIN_API_URL', 'https://fn.example.com')
      const { isRemoteAdminApi } = await import('@/lib/admin-api')

      expect(isRemoteAdminApi()).toBe(true)
    })
  })

  describe('adminDataUrl', () => {
    it('returns the local Next.js route when NEXT_PUBLIC_ADMIN_API_URL is not set', async () => {
      vi.stubEnv('NEXT_PUBLIC_ADMIN_API_URL', '')
      const { adminDataUrl } = await import('@/lib/admin-api')

      expect(adminDataUrl('/reservations')).toBe('/api/admin/reservations')
    })

    it('returns the remote Azure Functions URL when NEXT_PUBLIC_ADMIN_API_URL is set', async () => {
      vi.stubEnv('NEXT_PUBLIC_ADMIN_API_URL', 'https://fn.example.com')
      const { adminDataUrl } = await import('@/lib/admin-api')

      expect(adminDataUrl('/schedule?id=x')).toBe('https://fn.example.com/admin/schedule?id=x')
    })
  })

  describe('adminClientConfigUrl', () => {
    it('returns the local Next.js route when NEXT_PUBLIC_ADMIN_API_URL is not set', async () => {
      vi.stubEnv('NEXT_PUBLIC_ADMIN_API_URL', '')
      const { adminClientConfigUrl } = await import('@/lib/admin-api')

      expect(adminClientConfigUrl('client-a')).toBe('/api/admin/client-config')
    })

    it('returns the remote Azure Functions URL when NEXT_PUBLIC_ADMIN_API_URL is set', async () => {
      vi.stubEnv('NEXT_PUBLIC_ADMIN_API_URL', 'https://fn.example.com')
      const { adminClientConfigUrl } = await import('@/lib/admin-api')

      expect(adminClientConfigUrl('client a')).toBe('https://fn.example.com/clients/client%20a/config')
    })
  })

  describe('adminFetch', () => {
    it('calls the registered unauthorized handler once on a 401 response', async () => {
      vi.stubEnv('NEXT_PUBLIC_ADMIN_API_URL', '')
      const { adminFetch, setAdminUnauthorizedHandler } = await import('@/lib/admin-api')
      const handler = vi.fn()

      setAdminUnauthorizedHandler(handler)
      vi.mocked(fetch).mockResolvedValueOnce({ status: 401 } as Response)

      await adminFetch('/api/admin/auth/me')

      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('does not call the unauthorized handler on a 200 response', async () => {
      vi.stubEnv('NEXT_PUBLIC_ADMIN_API_URL', '')
      const { adminFetch, setAdminUnauthorizedHandler } = await import('@/lib/admin-api')
      const handler = vi.fn()

      setAdminUnauthorizedHandler(handler)
      vi.mocked(fetch).mockResolvedValueOnce({ status: 200 } as Response)

      await adminFetch('/api/admin/reservations')

      expect(handler).not.toHaveBeenCalled()
    })

    it('returns the 401 response without throwing when no handler is registered', async () => {
      vi.stubEnv('NEXT_PUBLIC_ADMIN_API_URL', '')
      const { adminFetch } = await import('@/lib/admin-api')
      const response = { status: 401 } as Response

      vi.mocked(fetch).mockResolvedValueOnce(response)

      await expect(adminFetch('/api/admin/auth/me')).resolves.toBe(response)
    })
  })
})
