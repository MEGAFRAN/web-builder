import { Heading } from '@/components/content/Heading'
import { Text } from '@/components/content/Text'
import { Section } from '@/components/layout/Section'
import { Stack } from '@/components/layout/Stack'

export default function AdminSettingsRoutePage() {
  return (
    <Section paddingY="lg" background="white">
      <Stack gap="md">
        <Heading text="Ajustes" level="h1" />
        <Text
          content="Aquí aparecerán las preferencias del negocio y las integraciones. Para cambios estructurales, contacte con el operador de la plataforma."
          color="muted"
          size="sm"
        />
      </Stack>
    </Section>
  )
}
