import type { ContactBlock as ContactBlockType } from '@/types/cms'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'

export default function ContactBlock({
  showMap,
  mapEmbedSrc,
  phone,
  email,
  address,
}: ContactBlockType) {
  const mapSrc = mapEmbedSrc?.trim() ?? ''
  const showIframe = showMap && mapSrc.length > 0

  return (
    <Section paddingY="lg">
      <Container maxWidth="2xl" padding="theme">
        <section data-component="contact-block">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
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
            {showIframe && (
              <div className="min-h-0">
                <iframe
                  data-testid="contact-map-iframe"
                  src={mapSrc}
                  title="Ubicación en Google Maps"
                  className="w-full max-w-[600px] h-[450px] border-0 rounded-lg"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            )}
          </div>
        </section>
      </Container>
    </Section>
  )
}
