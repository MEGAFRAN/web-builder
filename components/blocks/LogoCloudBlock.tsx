import type { LogoCloudBlock as LogoCloudBlockType } from '@/types/cms'
import { LogoCloud } from '@/components/sections/LogoCloud'

export default function LogoCloudBlock({
  title,
  context,
  logos,
}: LogoCloudBlockType) {
  // `context` allows the Sanity document to differentiate instances (e.g. "partners" vs "featured-in").
  // We surface it as the display title when no explicit title is provided.
  const displayTitle = title ?? context ?? null

  return <LogoCloud title={displayTitle} logos={logos} />
}
