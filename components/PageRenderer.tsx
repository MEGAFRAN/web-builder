import type { Block } from '@/types/cms'
import type { CompanyProfile } from '@/types/admin'
import componentRegistry from '@/components/componentRegistry'
import { ScrollReveal } from '@/components/motion/ScrollReveal'
import {
  mergeContactInfoBlockProps,
  mergeFooterBlockProps,
  mergeLocationBlockProps,
  mergeNavbarBlockProps,
} from '@/lib/company-profile-merge'

interface PageRendererProps {
  blocks: Block[]
  companyProfile?: CompanyProfile | null
}

type BlockWithKey = Block & { _key?: string }

function mergeBlockWithProfile(block: Block, companyProfile: CompanyProfile | null): Block {
  if (!companyProfile) return block
  switch (block._type) {
    case 'navbar':
      return mergeNavbarBlockProps(block, companyProfile)
    case 'footer':
      return mergeFooterBlockProps(block, companyProfile)
    case 'contactInfoBlock':
      return mergeContactInfoBlockProps(block, companyProfile)
    case 'location':
      return mergeLocationBlockProps(block, companyProfile)
    default:
      return block
  }
}

export default function PageRenderer({ blocks, companyProfile = null }: PageRendererProps) {
  return (
    <div>
      {blocks.map((block, i) => {
        const mergedBlock = mergeBlockWithProfile(block, companyProfile)
        const Component = componentRegistry[mergedBlock._type]
        if (!Component) {
          console.warn(`PageRenderer: unknown block type "${mergedBlock._type}"`)
          return null
        }
        const key = (mergedBlock as BlockWithKey)._key || i
        const content = <Component {...mergedBlock} />

        if (i < 2) {
          return <div key={key}>{content}</div>
        }

        return <ScrollReveal key={key}>{content}</ScrollReveal>
      })}
    </div>
  )
}
