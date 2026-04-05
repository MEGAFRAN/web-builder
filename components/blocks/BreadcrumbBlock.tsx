import type { BreadcrumbBlock as BreadcrumbBlockType } from '@/types/cms'
import { Breadcrumb } from '@/components/navigation/Breadcrumb'
import { Container } from '@/components/layout/Container'

export default function BreadcrumbBlock({ items }: BreadcrumbBlockType) {
  return (
    <div data-component="breadcrumb-block" className="bg-background border-b border-border py-3">
      <Container maxWidth="2xl" padding="md">
        <Breadcrumb items={items} />
      </Container>
    </div>
  )
}
