import type { NavbarBlock as NavbarBlockType } from '@/types/cms'
import { Navbar } from '@/components/navigation/Navbar'

export default function NavbarBlock({ logo, links, ctaLabel }: NavbarBlockType) {
  return (
    <div data-component="navbar-block">
      <Navbar logo={logo} links={links} ctaLabel={ctaLabel} />
    </div>
  )
}
