import type { Block } from '@/types/cms'
import HeroBlock from '@/components/blocks/HeroBlock'
import ServicesBlock from '@/components/blocks/ServicesBlock'
import ContactBlock from '@/components/blocks/ContactBlock'
import BlogListBlock from '@/components/blocks/BlogListBlock'

interface PageRendererProps {
  blocks: Block[]
}

export default function PageRenderer({ blocks }: PageRendererProps) {
  return (
    <div>
      {blocks.map((block, i) => {
        switch (block._type) {
          case 'hero':
            return <HeroBlock key={i} {...block} />
          case 'services':
            return <ServicesBlock key={i} {...block} />
          case 'contact':
            return <ContactBlock key={i} {...block} />
          case 'blog_list':
            return <BlogListBlock key={i} {...block} />
          default:
            return null
        }
      })}
    </div>
  )
}
