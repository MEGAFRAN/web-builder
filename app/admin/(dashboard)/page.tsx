import { redirect } from 'next/navigation'

export default function AdminIndexRedirectPage() {
  redirect('/admin/bookings')
  return null
}
