'use client'

import { Heading } from '@/components/content/Heading'
import { Text } from '@/components/content/Text'
import { Section } from '@/components/layout/Section'
import { Stack } from '@/components/layout/Stack'
import { adminCopy } from '@/components/admin/admin-copy'

export default function AdminSettingsRoutePage() {
  return (
    <Section paddingY="lg" background="white">
      <Stack gap="md">
        <Heading text={adminCopy.settings.heading} level="h1" />
        <Text
          content={adminCopy.settings.intro}
          color="muted"
          size="sm"
        />
      </Stack>
    </Section>
  )
}
