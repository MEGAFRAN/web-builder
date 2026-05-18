import { Suspense } from 'react'
import AdminLoginForm from '@/components/admin/AdminLoginForm'

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const q = await searchParams
  const misconfigured = q.error === 'misconfigured'

  return (
    <Suspense fallback={<p className="p-8 text-center text-muted">Cargando…</p>}>
      <AdminLoginForm misconfigured={misconfigured} />
    </Suspense>
  )
}
