import type { FeatureGridBlock as FeatureGridBlockType } from '@/types/cms'
import { FeatureGrid } from '@/components/sections/FeatureGrid'

export default function FeatureGridBlock({
  heading,
  items,
}: FeatureGridBlockType) {
  const features = items.map((item) => ({
    icon: item.iconUrl ?? null,
    title: item.heading,
    description: item.description,
  }))

  return (
    <div data-component="feature-grid-block">
      <FeatureGrid title={heading} features={features} />
    </div>
  )
}
