import { renderBrandIcon } from '@/lib/generate-brand-icon'

export const dynamic = 'force-static'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default async function Icon() {
  return renderBrandIcon(32)
}
