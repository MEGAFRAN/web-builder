import type { DividerBlock as DividerBlockType } from '@/types/cms'
import { Divider } from '@/components/layout/Divider'
import { Container } from '@/components/layout/Container'

export default function DividerBlock(_props: DividerBlockType) {
  return (
    <div data-component="divider-block">
      <Container maxWidth="2xl" padding="md">
        <Divider />
      </Container>
    </div>
  )
}
