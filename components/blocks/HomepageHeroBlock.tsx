import type { HomepageHeroBlock as HomepageHeroBlockType } from '@/types/cms'
import { Hero } from '@/components/sections/Hero'

export default function HomepageHeroBlock({
  heading,
  subtext,
  primaryButtonLabel,
  secondaryButtonLabel,
}: HomepageHeroBlockType) {
  return (
    <Hero
      headline={heading}
      subtext={subtext}
      ctaLabel={primaryButtonLabel}
      secondaryLabel={secondaryButtonLabel}
    />
  )
}
