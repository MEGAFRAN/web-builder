import AdminBookingsPage from '@/components/admin/AdminBookingsPage'

export default function AdminBookingsRoutePage() {
  const clientId = process.env.CLIENT_ID!
  return <AdminBookingsPage clientId={clientId} />
}
