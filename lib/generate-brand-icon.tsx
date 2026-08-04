import { getClientConfig, resolveTheme } from '@/lib/client-config'
import {
  ClubtalIconMark,
  ClubtalWhatsAppProfileMark,
  InitialIconMark,
  WHATSAPP_PROFILE_SIZE,
  isClubtalBrand,
} from '@/lib/brand-mark'
import {
  interSemiboldFont,
  loadInterSemibold,
} from '@/lib/brand-mark-fonts'

export function getBuildBrandContext() {
  const clientId = process.env.CLIENT_ID!
  const config = getClientConfig(clientId)
  const theme = resolveTheme(config.theme)
  const preset = config.theme.preset ?? null

  return {
    clientId,
    displayName: config.displayName,
    primaryColor: theme.primaryColor,
    preset,
    isClubtal: isClubtalBrand(clientId, preset),
  }
}

export async function renderBrandIcon(size: number) {
  const { ImageResponse } = await import('next/og')
  const brand = getBuildBrandContext()
  const interSemibold = loadInterSemibold()

  const content = brand.isClubtal ? (
    <ClubtalIconMark size={size} />
  ) : (
    <InitialIconMark
      size={size}
      letter={brand.displayName.trim().charAt(0).toUpperCase() || '?'}
      backgroundColor={brand.primaryColor}
    />
  )

  return new ImageResponse(content, {
    width: size,
    height: size,
    fonts: [{ ...interSemiboldFont, data: interSemibold }],
  })
}

/** Native 640×640 wordmark-on-white for WhatsApp Business — not derived from icons. */
export async function renderClubtalWhatsAppProfile(
  size: number = WHATSAPP_PROFILE_SIZE,
) {
  const { ImageResponse } = await import('next/og')
  const interSemibold = loadInterSemibold()

  return new ImageResponse(<ClubtalWhatsAppProfileMark size={size} />, {
    width: size,
    height: size,
    fonts: [{ ...interSemiboldFont, data: interSemibold }],
  })
}
