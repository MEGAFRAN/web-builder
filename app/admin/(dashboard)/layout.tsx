import { getClientConfig } from '@/lib/client-config'
import AdminShell from '@/components/admin/AdminShell'

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const clientId = process.env.CLIENT_ID!
  const config = getClientConfig(clientId)

  return (
    <AdminShell businessName={config.displayName} logoUrl={config.header?.logo ?? null}>
      {children}
    </AdminShell>
  )
}
