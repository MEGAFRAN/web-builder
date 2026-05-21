import type { ContactInfoBlock as ContactInfoBlockType } from '@/types/cms'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { Stack } from '@/components/layout/Stack'
import { Card } from '@/components/data/Card'
import { CONTACT_COPY } from '@/lib/contact-public-copy'
import ContactFormSection from '@/components/blocks/ContactFormSection'

export default function ContactInfoBlock({
  email,
  phone,
  address,
  fallbackEmail,
}: ContactInfoBlockType) {
  return (
    <div data-component="contact-info-block">
      <Section background="gray" paddingY="md">
        <Container maxWidth="2xl" padding="theme">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-5 lg:gap-12">
            <div className="lg:col-span-3">
              <Card title={undefined} description={undefined} padding="lg">
                <ContactFormSection fallbackEmail={fallbackEmail ?? email} />
              </Card>
            </div>

            <div className="lg:col-span-2">
              <Stack gap="md">
                {email && (
                  <div className="rounded-[var(--radius)] border border-border bg-surface p-5">
                    <p className="text-sm font-semibold text-brand">
                      {CONTACT_COPY.emailLabel}
                    </p>
                    <a
                      href={`mailto:${email}`}
                      className="mt-2 block text-base text-foreground transition-colors hover:text-primary"
                    >
                      {email}
                    </a>
                  </div>
                )}
                {phone && (
                  <div className="rounded-[var(--radius)] border border-border bg-surface p-5">
                    <p className="text-sm font-semibold text-brand">
                      {CONTACT_COPY.phoneLabel}
                    </p>
                    <a
                      href={`tel:${phone.replace(/\s/g, '')}`}
                      className="mt-2 block text-base text-foreground transition-colors hover:text-primary"
                    >
                      {phone}
                    </a>
                  </div>
                )}
                {address && (
                  <div className="rounded-[var(--radius)] border border-border bg-surface p-5">
                    <p className="text-sm font-semibold text-brand">
                      {CONTACT_COPY.addressLabel}
                    </p>
                    <p className="mt-2 text-base text-muted">{address}</p>
                  </div>
                )}
              </Stack>
            </div>
          </div>
        </Container>
      </Section>
    </div>
  )
}
