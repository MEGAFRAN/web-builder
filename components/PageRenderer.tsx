import type { Block } from '@/types/cms'
import componentRegistry from '@/components/componentRegistry'

interface PageRendererProps {
  blocks: Block[]
}

type BlockWithKey = Block & { _key?: string }

export default function PageRenderer({ blocks }: PageRendererProps) {
  return (
    <div>
      {blocks.map((block, i) => {
        const Component = componentRegistry[block._type]
        if (!Component) {
          console.warn(`PageRenderer: unknown block type "${block._type}"`)
          return null
        }
        return <Component key={(block as BlockWithKey)._key || i} {...block} />
      })}
    </div>
  )
}
