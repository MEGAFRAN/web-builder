import type { LogoCloudBlock as LogoCloudBlockType } from '@/types/cms'
import { LogoCloud } from '@/components/sections/LogoCloud'

export default function LogoCloudBlock({
  title,
  context,
  logos,
}: LogoCloudBlockType) {
  // `context` differentiates logo cloud instances (e.g. "partners" vs "featured-in").
  // We surface it as the display title when no explicit title is provided.
  const displayTitle = title ?? context ?? null

  return (
    <div data-component="logo-cloud-block">
      <LogoCloud title={displayTitle} logos={logos} />
    </div>
  )
}
