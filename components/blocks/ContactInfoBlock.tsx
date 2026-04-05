import type { ContactInfoBlock as ContactInfoBlockType } from '@/types/cms'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { Stack } from '@/components/layout/Stack'
import { Heading } from '@/components/content/Heading'
import { Text } from '@/components/content/Text'
import { Divider } from '@/components/layout/Divider'
import ContactFormSection from '@/components/blocks/ContactFormSection'

export default function ContactInfoBlock({ email, phone, address, fallbackEmail }: ContactInfoBlockType) {
  return (
    <div data-component="contact-info-block">
      {/* Page Header */}
      <Section background="white" paddingY="lg">
        <Container maxWidth="2xl" padding="md">
          <Stack gap="sm">
            <Heading text="Get in Touch" level="h1" />
            <Text
              content="We respond to all inquiries within 1 business day. Fill in the form and we'll get back to you as soon as possible."
              size="lg"
              color="muted"
            />
          </Stack>
        </Container>
      </Section>

      {/* Two-column form + contact details */}
      <Section background="white" paddingY="md">
        <Container maxWidth="2xl" padding="md">
          {/* Asymmetric two-column grid: ~60% left, ~40% right */}
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-5">
            {/* Left column: form + alert */}
            <div className="lg:col-span-3">
              <ContactFormSection fallbackEmail={fallbackEmail ?? email} />
            </div>

            {/* Right column: contact details */}
            <div className="lg:col-span-2">
              <Stack gap="lg">
                {email && (
                  <Stack gap="sm">
                    <Heading text="Email" level="h3" />
                    <Text content={email} color="muted" />
                  </Stack>
                )}
                {phone && (
                  <Stack gap="sm">
                    <Heading text="Phone" level="h3" />
                    <Text content={phone} color="muted" />
                  </Stack>
                )}
                {address && (
                  <Stack gap="sm">
                    <Heading text="Office" level="h3" />
                    <Text content={address} color="muted" />
                  </Stack>
                )}
              </Stack>
            </div>
          </div>
        </Container>
      </Section>

      {/* Divider before FAQ */}
      <Container maxWidth="2xl" padding="md">
        <Divider />
      </Container>
    </div>
  )
}
