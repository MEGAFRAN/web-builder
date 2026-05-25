import type { HomepageHeroBlock as HomepageHeroBlockType } from '@/types/cms'
import { Hero } from '@/components/sections/Hero'

export default function HomepageHeroBlock({
  heading,
  subtext,
  primaryButtonLabel,
  primaryButtonHref,
  backgroundImageUrl,
}: HomepageHeroBlockType) {
  return (
    <div data-component="homepage-hero-block">
      <Hero
        headline={heading}
        subtext={subtext}
        ctaLabel={primaryButtonLabel}
        ctaAction={primaryButtonHref}
        backgroundImageUrl={backgroundImageUrl}
        gradientFallback
        fullViewportHeightMobile
      />
    </div>
  )
}
