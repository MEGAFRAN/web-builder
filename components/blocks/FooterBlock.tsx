import type { FooterBlock as FooterBlockType } from '@/types/cms'
import { Footer } from '@/components/navigation/Footer'

export default function FooterBlock({ columns, copyright }: FooterBlockType) {
  return (
    <div id="contact" data-component="footer-block">
      <Footer columns={columns} copyright={copyright} />
    </div>
  )
}
