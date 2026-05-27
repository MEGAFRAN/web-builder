'use client'

import AdminCompanyProfileForm from '@/components/admin/AdminCompanyProfileForm'
import AdminStripeConnectSection from '@/components/admin/AdminStripeConnectSection'
import { Section } from '@/components/layout/Section'

export default function AdminSettingsRoutePage() {
  return (
    <>
      <AdminCompanyProfileForm />
      <Section paddingY="lg" background="white">
        <AdminStripeConnectSection />
      </Section>
    </>
  )
}
