import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import {
  AdminAuthProvider,
  useAdminAuth,
} from '@/lib/admin-auth-context'
import type { AdminSessionInfo } from '@/lib/admin-api'

const mockPush = vi.fn()
const mockReplace = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}))

const validSession: AdminSessionInfo = {
  email: 'owner@example.com',
  clientId: 'client-a',
}

function AuthStateProbe() {
  const { status, session } = useAdminAuth()
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="email">{session?.email ?? ''}</span>
      <span data-testid="clientId">{session?.clientId ?? ''}</span>
    </div>
  )
}

function AuthActionsProbe({
  onReady,
}: {
  onReady: (actions: ReturnType<typeof useAdminAuth>) => void
}) {
  const auth = useAdminAuth()
  onReady(auth)
  return <AuthStateProbe />
}

function seedSession(session: AdminSessionInfo): void {
  sessionStorage.setItem('admin-session-v1', JSON.stringify(session))
}

describe('AdminAuthProvider', () => {
  beforeEach(() => {
    sessionStorage.clear()
    mockPush.mockReset()
    mockReplace.mockReset()
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('bootstrap behaviour', () => {
    it('becomes unauthenticated without calling /auth/me when sessionStorage is empty', async () => {
      render(
        <AdminAuthProvider>
          <AuthStateProbe />
        </AdminAuthProvider>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated')
      })

      expect(fetch).not.toHaveBeenCalled()
      expect(screen.getByTestId('email')).toHaveTextContent('')
      expect(screen.getByTestId('clientId')).toHaveTextContent('')
    })

    it('becomes authenticated when stored session validates via /auth/me', async () => {
      seedSession(validSession)
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => validSession,
      } as Response)

      render(
        <AdminAuthProvider>
          <AuthStateProbe />
        </AdminAuthProvider>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('status')).toHaveTextContent('authenticated')
      })

      expect(fetch).toHaveBeenCalledWith(
        '/api/admin/auth/me',
        expect.objectContaining({ credentials: 'include' }),
      )
      expect(screen.getByTestId('email')).toHaveTextContent(validSession.email)
      expect(screen.getByTestId('clientId')).toHaveTextContent(validSession.clientId)
    })

    it('clears sessionStorage and becomes unauthenticated when /auth/me returns 401', async () => {
      seedSession(validSession)
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as Response)

      render(
        <AdminAuthProvider>
          <AuthStateProbe />
        </AdminAuthProvider>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated')
      })

      expect(sessionStorage.length).toBe(0)
      expect(screen.getByTestId('email')).toHaveTextContent('')
      expect(screen.getByTestId('clientId')).toHaveTextContent('')
    })

    it('falls back to stored session when /auth/me fails with a network error', async () => {
      seedSession(validSession)
      vi.mocked(fetch).mockRejectedValueOnce(new Error('network down'))

      render(
        <AdminAuthProvider>
          <AuthStateProbe />
        </AdminAuthProvider>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('status')).toHaveTextContent('authenticated')
      })

      expect(screen.getByTestId('email')).toHaveTextContent(validSession.email)
      expect(screen.getByTestId('clientId')).toHaveTextContent(validSession.clientId)
    })

    it('becomes unauthenticated when sessionStorage contains invalid JSON', async () => {
      sessionStorage.setItem('admin-session-v1', '{not-json')

      render(
        <AdminAuthProvider>
          <AuthStateProbe />
        </AdminAuthProvider>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated')
      })

      expect(fetch).not.toHaveBeenCalled()
    })

    it('becomes unauthenticated when sessionStorage has a malformed session shape', async () => {
      sessionStorage.setItem('admin-session-v1', JSON.stringify({ email: 123, clientId: null }))

      render(
        <AdminAuthProvider>
          <AuthStateProbe />
        </AdminAuthProvider>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated')
      })

      expect(fetch).not.toHaveBeenCalled()
    })

    it('clears session when /auth/me returns a payload with invalid fields', async () => {
      seedSession(validSession)
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ email: 123, clientId: null }),
      } as Response)

      render(
        <AdminAuthProvider>
          <AuthStateProbe />
        </AdminAuthProvider>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated')
      })

      expect(sessionStorage.length).toBe(0)
    })

    it('redirects to login using the current admin path when bootstrap receives 401', async () => {
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: { pathname: '/admin/bookings' },
      })

      seedSession(validSession)
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as Response)

      render(
        <AdminAuthProvider>
          <AuthStateProbe />
        </AdminAuthProvider>,
      )

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith(
          '/admin/login?redirect=%2Fadmin%2Fbookings',
        )
      })
    })

    it('redirects to bookings when unauthorized outside an admin route', async () => {
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: { pathname: '/' },
      })

      seedSession(validSession)
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as Response)

      render(
        <AdminAuthProvider>
          <AuthStateProbe />
        </AdminAuthProvider>,
      )

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith(
          '/admin/login?redirect=%2Fadmin%2Fbookings',
        )
      })
    })

    it('does not update state after unmount when bootstrap resolves late', async () => {
      seedSession(validSession)
      let resolveFetch: ((value: Response) => void) | undefined
      vi.mocked(fetch).mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFetch = resolve
          }),
      )

      const { unmount } = render(
        <AdminAuthProvider>
          <AuthStateProbe />
        </AdminAuthProvider>,
      )

      unmount()
      resolveFetch?.({
        ok: true,
        status: 200,
        json: async () => validSession,
      } as Response)

      await Promise.resolve()
    })

    it('does not update state after unmount when bootstrap fails late', async () => {
      seedSession(validSession)
      let rejectFetch: ((reason: Error) => void) | undefined
      vi.mocked(fetch).mockImplementationOnce(
        () =>
          new Promise((_resolve, reject) => {
            rejectFetch = reject
          }),
      )

      const { unmount } = render(
        <AdminAuthProvider>
          <AuthStateProbe />
        </AdminAuthProvider>,
      )

      unmount()
      rejectFetch?.(new Error('network down'))

      await Promise.resolve()
    })
  })

  describe('setSession / signOut', () => {
    it('writes session and becomes authenticated when setSession is called', async () => {
      let authActions: ReturnType<typeof useAdminAuth> | null = null

      render(
        <AdminAuthProvider>
          <AuthActionsProbe
            onReady={(auth) => {
              authActions = auth
            }}
          />
        </AdminAuthProvider>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated')
      })

      authActions!.setSession(validSession)

      await waitFor(() => {
        expect(screen.getByTestId('status')).toHaveTextContent('authenticated')
      })

      expect(screen.getByTestId('email')).toHaveTextContent(validSession.email)
      expect(screen.getByTestId('clientId')).toHaveTextContent(validSession.clientId)
      expect(sessionStorage.length).toBeGreaterThan(0)
    })

    it('calls logout, clears session, and navigates to login on signOut', async () => {
      let authActions: ReturnType<typeof useAdminAuth> | null = null
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 200,
      } as Response)

      render(
        <AdminAuthProvider>
          <AuthActionsProbe
            onReady={(auth) => {
              authActions = auth
            }}
          />
        </AdminAuthProvider>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated')
      })

      authActions!.setSession(validSession)

      await waitFor(() => {
        expect(screen.getByTestId('status')).toHaveTextContent('authenticated')
      })

      await authActions!.signOut()

      await waitFor(() => {
        expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated')
      })

      expect(fetch).toHaveBeenCalledWith(
        '/api/admin/auth/logout',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        }),
      )
      expect(sessionStorage.length).toBe(0)
      expect(mockPush).toHaveBeenCalledWith('/admin/login')
    })

    it('clears session via setSession(null)', async () => {
      let authActions: ReturnType<typeof useAdminAuth> | null = null

      render(
        <AdminAuthProvider>
          <AuthActionsProbe
            onReady={(auth) => {
              authActions = auth
            }}
          />
        </AdminAuthProvider>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated')
      })

      authActions!.setSession(validSession)

      await waitFor(() => {
        expect(screen.getByTestId('status')).toHaveTextContent('authenticated')
      })

      authActions!.setSession(null)

      await waitFor(() => {
        expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated')
      })

      expect(sessionStorage.length).toBe(0)
    })
  })
})

describe('useAdminAuth', () => {
  it('throws when used outside AdminAuthProvider', () => {
    function OrphanConsumer() {
      useAdminAuth()
      return null
    }

    expect(() => render(<OrphanConsumer />)).toThrow(
      'useAdminAuth must be used within AdminAuthProvider',
    )
  })
})
