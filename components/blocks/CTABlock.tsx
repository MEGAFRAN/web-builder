import type { CTABlock as CTABlockType } from '@/types/cms'
import { CTA } from '@/components/sections/CTA'

export default function CTABlock({
  headline,
  subtext,
  ctaLabel,
  background,
}: CTABlockType) {
  return (
    <CTA
      headline={headline}
      subtext={subtext}
      ctaLabel={ctaLabel}
      background={background ?? 'gray'}
    />
  )
}
