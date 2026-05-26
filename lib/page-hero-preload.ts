import type { Block, HomepageHeroBlock } from '@/types/cms'

function isHomepageHeroBlock(block: Block): block is HomepageHeroBlock {
  return block._type === 'heroBlock'
}

function getHeroBackgroundImageUrl(block: HomepageHeroBlock): string | null {
  const url = block.backgroundImageUrl?.trim()
  return url ? url : null
}

/** Returns the hero background image URL when the page includes a photo hero block. */
export function findHomepageHeroBackgroundImageUrl(
  blocks: Block[] | null | undefined,
): string | null {
  if (!blocks?.length) return null

  const heroBlock = blocks.find(isHomepageHeroBlock)
  if (!heroBlock) return null

  return getHeroBackgroundImageUrl(heroBlock)
}
