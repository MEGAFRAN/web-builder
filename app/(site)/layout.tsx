import { getClientConfig } from '@/lib/client-config'
import { getCompanyProfile } from '@/lib/company-profile'
import {
  mergeBottomActionBarItems,
  mergeLayoutFooter,
  mergeLayoutHeader,
} from '@/lib/company-profile-merge'
import { Navbar } from '@/components/navigation/Navbar'
import { Footer } from '@/components/navigation/Footer'
import { BottomCtaBar } from '@/components/navigation/BottomCtaBar'

/** Space for fixed `BottomCtaBar` so page content is not hidden behind it. */
const BODY_PAD_WITH_BOTTOM_CTA =
  'pb-[calc(4.25rem+env(safe-area-inset-bottom,0px))]'

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const clientId = process.env.CLIENT_ID!
  const config = getClientConfig(clientId)
  const profile = await getCompanyProfile(clientId)

  const header = mergeLayoutHeader(config.header, profile)
  const footer = mergeLayoutFooter(config.footer, profile)
  const bottomBarItems = mergeBottomActionBarItems(
    config.bottomActionBar?.items?.filter((i) => i.label?.trim() && i.href?.trim()) ?? [],
    profile,
  )
  const showBottomCta = bottomBarItems.length > 0

  return (
    <>
      {header && (
        <Navbar
          logo={header.logo}
          links={header.links}
          ctaLabel={header.ctaLabel}
          ctaAction={header.ctaAction}
        />
      )}
      <div className={showBottomCta ? BODY_PAD_WITH_BOTTOM_CTA : undefined}>{children}</div>
      {footer && (
        <Footer columns={footer.columns} copyright={footer.copyright} />
      )}
      {showBottomCta && (
        <BottomCtaBar
          items={bottomBarItems}
          vendorScriptWidget={config.bottomActionBar?.vendorScriptWidget ?? null}
        />
      )}
    </>
  )
}
