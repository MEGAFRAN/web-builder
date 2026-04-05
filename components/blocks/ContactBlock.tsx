import type { ContactBlock as ContactBlockType } from '@/types/cms'

export default function ContactBlock({ showMap, phone, email, address }: ContactBlockType) {
  return (
    <section className="section">
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
        {showMap && (
          <div
            data-testid="map-placeholder"
            className="bg-surface rounded-lg h-64 flex items-center justify-center text-muted"
          >
            Mapa (integrar Google Maps / Leaflet)
          </div>
        )}
      </div>
    </section>
  )
}
