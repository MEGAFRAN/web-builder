import type { ContactBlock as ContactBlockType } from '@/types/cms'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'

export default function ContactBlock({
  title,
  phone,
  email,
  address,
}: ContactBlockType) {
  return (
    <Section paddingY="lg">
      <Container maxWidth="2xl" padding="theme">
        <section data-component="contact-block">
          {title && (
            <h2 className="mb-8 text-3xl font-bold text-foreground">{title}</h2>
          )}
          <div className="space-y-4">
            {phone && (
              <p className="flex items-center gap-2 text-foreground">
                <span className="font-semibold text-brand">Tel:</span>
                {phone}
              </p>
            )}
            {email && (
              <p className="flex items-center gap-2 text-foreground">
                <span className="font-semibold text-brand">Email:</span>
                {email}
              </p>
            )}
            {address && (
              <p className="flex items-center gap-2 text-foreground">
                <span className="font-semibold text-brand">Dirección:</span>
                {address}
              </p>
            )}
          </div>
        </section>
      </Container>
    </Section>
  )
}
