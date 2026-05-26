'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import {
  adminAuthUrl,
  adminFetch,
  clearAdminToken,
  setAdminUnauthorizedHandler,
  type AdminSessionInfo,
} from '@/lib/admin-api'

const SESSION_STORAGE_KEY = 'admin-session-v1'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

type AdminAuthContextValue = {
  session: AdminSessionInfo | null
  status: AuthStatus
  setSession: (session: AdminSessionInfo | null) => void
  signOut: () => Promise<void>
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null)

function readStoredSession(): AdminSessionInfo | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AdminSessionInfo
    if (typeof parsed.email !== 'string' || typeof parsed.clientId !== 'string') {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function writeStoredSession(session: AdminSessionInfo | null): void {
  if (typeof window === 'undefined') return
  if (session === null) {
    sessionStorage.removeItem(SESSION_STORAGE_KEY)
    return
  }
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [session, setSessionState] = useState<AdminSessionInfo | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')

  const setSession = useCallback((next: AdminSessionInfo | null) => {
    writeStoredSession(next)
    setSessionState(next)
    setStatus(next ? 'authenticated' : 'unauthenticated')
  }, [])

  const redirectToLogin = useCallback(() => {
    const pathname = window.location.pathname
    const redirect =
      pathname.startsWith('/admin') && pathname !== '/admin/login'
        ? pathname
        : '/admin/bookings'
    router.replace(`/admin/login?redirect=${encodeURIComponent(redirect)}`)
  }, [router])

  const signOut = useCallback(async () => {
    clearAdminToken()
    await adminFetch(adminAuthUrl('logout'), { method: 'POST' })
    setSession(null)
    router.push('/admin/login')
  }, [router, setSession])

  useEffect(() => {
    setAdminUnauthorizedHandler(() => {
      setSession(null)
      redirectToLogin()
    })
    return () => setAdminUnauthorizedHandler(null)
  }, [redirectToLogin, setSession])

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      const stored = readStoredSession()
      if (!stored) {
        if (!cancelled) {
          setSessionState(null)
          setStatus('unauthenticated')
        }
        return
      }

      try {
        const res = await adminFetch(adminAuthUrl('me'))
        if (cancelled) return
        if (!res.ok) {
          writeStoredSession(null)
          setSessionState(null)
          setStatus('unauthenticated')
          return
        }
        const data = (await res.json()) as AdminSessionInfo
        if (typeof data.email !== 'string' || typeof data.clientId !== 'string') {
          writeStoredSession(null)
          setSessionState(null)
          setStatus('unauthenticated')
          return
        }
        writeStoredSession(data)
        setSessionState(data)
        setStatus('authenticated')
      } catch {
        if (!cancelled) {
          setSessionState(stored)
          setStatus('authenticated')
        }
      }
    }

    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo<AdminAuthContextValue>(
    () => ({ session, status, setSession, signOut }),
    [session, status, setSession, signOut],
  )

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider')
  }
  return ctx
}
