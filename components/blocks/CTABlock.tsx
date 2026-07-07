import type { CTABlock as CTABlockType } from '@/types/cms'
import { CTA } from '@/components/sections/CTA'

export default function CTABlock({
  headline,
  subtext,
  ctaLabel,
  ctaHref,
  background,
}: CTABlockType) {
  return (
    <div data-component="cta-block">
      <CTA
        headline={headline}
        subtext={subtext}
        ctaLabel={ctaLabel}
        ctaAction={ctaHref}
        background={background ?? 'gray'}
      />
    </div>
  )
}
