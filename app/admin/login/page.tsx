'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import AdminLoginForm from '@/components/admin/AdminLoginForm'

function AdminLoginPageContent() {
  const searchParams = useSearchParams()
  const misconfigured = searchParams.get('error') === 'misconfigured'

  return <AdminLoginForm misconfigured={misconfigured} />
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center text-muted">Cargando…</p>}>
      <AdminLoginPageContent />
    </Suspense>
  )
}
