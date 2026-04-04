import type { FooterBlock as FooterBlockType } from '@/types/cms'
import { Footer } from '@/components/navigation/Footer'

export default function FooterBlock({ columns, copyright }: FooterBlockType) {
  return <Footer columns={columns} copyright={copyright} />
}
