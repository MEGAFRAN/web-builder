import type { FaqBlock as FaqBlockType } from '@/types/cms'
import { FAQ } from '@/components/sections/FAQ'
import { Section } from '@/components/layout/Section'

export default function FaqBlock({ title, items }: FaqBlockType) {
  return (
    <Section background="white" paddingY="lg">
      <FAQ title={title} items={items} />
    </Section>
  )
}
