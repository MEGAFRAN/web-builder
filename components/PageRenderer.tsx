import type { Block, ReservationServiceItem } from '@/types/cms'
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
  /** Deployment tenant id; injected into booking blocks when page JSON omits clientId. */
  clientId?: string
  /** Services catalog fetched once at SSG build time for this page's booking blocks. */
  bookingCatalog?: ReservationServiceItem[]
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

function mergeBlockWithBuildContext(
  block: Block,
  clientId: string,
  bookingCatalog?: ReservationServiceItem[],
): Block {
  switch (block._type) {
    case 'services':
    case 'reservationBlock':
      return {
        ...block,
        clientId: block.clientId ?? clientId,
        ...(bookingCatalog !== undefined ? { buildTimeCatalog: bookingCatalog } : {}),
      }
    default:
      return block
  }
}

export default function PageRenderer({
  blocks,
  companyProfile = null,
  clientId,
  bookingCatalog,
}: PageRendererProps) {
  return (
    <div>
      {blocks.map((block, i) => {
        const withClient =
          clientId != null
            ? mergeBlockWithBuildContext(block, clientId, bookingCatalog)
            : block
        const mergedBlock = mergeBlockWithProfile(withClient, companyProfile)
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
