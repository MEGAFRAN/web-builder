import type { LocationBlock as LocationBlockType } from '@/types/cms'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'

export default function LocationBlock({
  title,
  showMap,
  mapEmbedSrc,
  address,
}: LocationBlockType) {
  const mapSrc = mapEmbedSrc?.trim() ?? ''
  const showIframe = showMap && mapSrc.length > 0
  const trimmedAddress = address?.trim() ?? ''
  const showAddress = trimmedAddress.length > 0

  if (!showIframe && !showAddress) {
    return null
  }

  return (
    <Section paddingY="lg">
      <Container maxWidth="2xl" padding="theme">
        <section id="location" data-component="location-block">
          {title && (
            <h2 className="mb-8 text-3xl font-bold text-foreground">{title}</h2>
          )}
          <div className="space-y-6">
            {showAddress && (
              <p className="flex items-center gap-2 text-foreground">
                <span className="font-semibold text-brand"></span>
                {trimmedAddress}
              </p>
            )}
            {showIframe && (
              <div className="min-h-0">
                <iframe
                  data-testid="location-map-iframe"
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
