import { renderBrandIcon } from '@/lib/generate-brand-icon'

export const dynamic = 'force-static'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default async function AppleIcon() {
  return renderBrandIcon(180)
}
