import { ImageResponse } from 'next/og'
import { ClubtalOgImageContent } from '@/lib/brand-mark'
import {
  interRegularFont,
  interSemiboldFont,
  loadInterRegular,
  loadInterSemibold,
} from '@/lib/brand-mark-fonts'
import { getBuildBrandContext } from '@/lib/generate-brand-icon'

export const dynamic = 'force-static'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OpenGraphImage() {
  const brand = getBuildBrandContext()
  const interSemibold = loadInterSemibold()
  const interRegular = loadInterRegular()

  const content = brand.isClubtal ? (
    <ClubtalOgImageContent />
  ) : (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 80,
        backgroundColor: '#ffffff',
        fontFamily: 'Inter',
      }}
    >
      <div
        style={{
          fontSize: 64,
          fontWeight: 600,
          color: brand.primaryColor,
        }}
      >
        {brand.displayName}
      </div>
    </div>
  )

  return new ImageResponse(content, {
    ...size,
    fonts: [
      { ...interSemiboldFont, data: interSemibold },
      { ...interRegularFont, data: interRegular },
    ],
  })
}
