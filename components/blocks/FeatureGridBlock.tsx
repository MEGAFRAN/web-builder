import type { FeatureGridBlock as FeatureGridBlockType } from '@/types/cms'
import { FeatureGrid } from '@/components/sections/FeatureGrid'

export default function FeatureGridBlock({
  heading,
  subtitle,
  items,
  cols,
  variant,
}: FeatureGridBlockType) {
  const features = items.map((item) => ({
    icon: item.iconUrl ?? null,
    title: item.heading,
    description: item.description,
  }))

  return (
    <div data-component="feature-grid-block">
      <FeatureGrid
        title={heading}
        subtitle={subtitle}
        features={features}
        cols={cols}
        variant={variant}
      />
    </div>
  )
}
