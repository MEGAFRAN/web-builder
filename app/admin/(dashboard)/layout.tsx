'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import AdminShell from '@/components/admin/AdminShell'
import { useAdminAuth } from '@/lib/admin-auth-context'
import { adminCopy } from '@/components/admin/admin-copy'

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const { session, status } = useAdminAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (status !== 'unauthenticated') return
    const redirect = pathname.startsWith('/admin') ? pathname : '/admin/bookings'
    router.replace(`/admin/login?redirect=${encodeURIComponent(redirect)}`)
  }, [status, router, pathname])

  if (status === 'loading') {
    return <p className="p-8 text-center text-muted">{adminCopy.common.loading}</p>
  }

  if (!session) {
    return <p className="p-8 text-center text-muted">{adminCopy.common.loading}</p>
  }

  return <AdminShell>{children}</AdminShell>
}
