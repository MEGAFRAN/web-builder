import type { Block, HomepageHeroBlock } from '@/types/cms'

/** Blob-managed hero asset path (same origin, uploaded to the $web/images/ prefix). */
export const HERO_BACKGROUND_IMAGE_PATH = '/images/hero.webp'

function isHomepageHeroBlock(block: Block): block is HomepageHeroBlock {
  return block._type === 'heroBlock'
}

function heroBlockHasBackgroundImage(block: HomepageHeroBlock): boolean {
  return Boolean(block.backgroundImageUrl?.trim())
}

/** Returns the hero preload path when the page includes a photo hero block. */
export function findHomepageHeroBackgroundImageUrl(
  blocks: Block[] | null | undefined,
): string | null {
  if (!blocks?.length) return null

  const heroBlock = blocks.find(isHomepageHeroBlock)
  if (!heroBlock || !heroBlockHasBackgroundImage(heroBlock)) return null

  return HERO_BACKGROUND_IMAGE_PATH
}
