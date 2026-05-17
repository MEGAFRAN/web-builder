import { Heading } from '@/components/content/Heading'
import { Text } from '@/components/content/Text'
import { Section } from '@/components/layout/Section'
import { Stack } from '@/components/layout/Stack'

export default function AdminSettingsRoutePage() {
  return (
    <Section paddingY="lg" background="white">
      <Stack gap="md">
        <Heading text="Settings" level="h1" />
        <Text
          content="Business preferences and integrations will appear here. Contact your platform operator for structural changes."
          color="muted"
          size="sm"
        />
      </Stack>
    </Section>
  )
}
