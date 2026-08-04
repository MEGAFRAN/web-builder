/** Shared JSX for Clubtal brand marks rendered via next/og ImageResponse. */

export const CLUBTAL_BRAND = {
  primary: '#111827',
  accent: '#2563eb',
  background: '#ffffff',
  surface: '#f9fafb',
  muted: '#4b5563',
  border: '#e5e7eb',
} as const

export function ClubtalIconMark({
  size,
  letter = 'c',
}: {
  size: number
  letter?: string
}) {
  const fontSize = Math.round(size * 0.55)
  const radius = Math.round(size * 0.2)

  return (
    <div
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: CLUBTAL_BRAND.primary,
        borderRadius: radius,
      }}
    >
      <span
        style={{
          color: '#ffffff',
          fontSize,
          fontWeight: 600,
          fontFamily: 'Inter',
          lineHeight: 1,
          marginTop: Math.round(size * 0.04),
        }}
      >
        {letter}
      </span>
    </div>
  )
}

export function InitialIconMark({
  size,
  letter,
  backgroundColor,
}: {
  size: number
  letter: string
  backgroundColor: string
}) {
  const fontSize = Math.round(size * 0.5)
  const radius = Math.round(size * 0.2)

  return (
    <div
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor,
        borderRadius: radius,
      }}
    >
      <span
        style={{
          color: '#ffffff',
          fontSize,
          fontWeight: 600,
          fontFamily: 'Inter',
          lineHeight: 1,
        }}
      >
        {letter}
      </span>
    </div>
  )
}

export function ClubtalOgImageContent() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 80,
        backgroundColor: CLUBTAL_BRAND.background,
        fontFamily: 'Inter',
      }}
    >
      <div
        style={{
          fontSize: 72,
          fontWeight: 600,
          color: CLUBTAL_BRAND.primary,
          marginBottom: 24,
        }}
      >
        clubtal
      </div>
      <div
        style={{
          fontSize: 36,
          fontWeight: 400,
          color: CLUBTAL_BRAND.primary,
          marginBottom: 48,
        }}
      >
        tu web profesional, lista hoy
      </div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 400,
          color: CLUBTAL_BRAND.muted,
          maxWidth: 900,
          lineHeight: 1.4,
        }}
      >
        La web profesional para tu negocio — 39€/mes + IVA (100% deducible). Sin coste de alta.
      </div>
    </div>
  )
}

/** Native size for WhatsApp Business profile photo — never upscale from icons. */
export const WHATSAPP_PROFILE_SIZE = 640

/**
 * Wordmark on white for WhatsApp Business profile.
 * Fits inside the circular crop (~85% safe diameter) with a light border ring
 * so the white tile remains visible on WhatsApp's white chat background.
 */
export function ClubtalWhatsAppProfileMark({
  size = WHATSAPP_PROFILE_SIZE,
}: {
  size?: number
}) {
  const safeDiameter = Math.round(size * 0.85)
  const fontSize = Math.round(size * 0.15)
  const borderWidth = Math.max(2, Math.round(size * 0.00625))

  return (
    <div
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: CLUBTAL_BRAND.background,
        fontFamily: 'Inter',
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `${borderWidth}px solid ${CLUBTAL_BRAND.border}`,
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            width: safeDiameter,
            height: safeDiameter,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              color: CLUBTAL_BRAND.primary,
              fontSize,
              fontWeight: 600,
              fontFamily: 'Inter',
              lineHeight: 1,
              letterSpacing: '-0.02em',
            }}
          >
            clubtal
          </span>
        </div>
      </div>
    </div>
  )
}

export function isClubtalBrand(clientId: string, preset?: string | null): boolean {
  return clientId === 'clubtal' || preset === 'clubtal-brand'
}
