import './globals.css'
import { getClientConfig, resolveTheme } from '@/lib/client-config'
import { buildThemeStyles } from '@/lib/theme-utils'
import { Navbar } from '@/components/navigation/Navbar'
import { Footer } from '@/components/navigation/Footer'
import { BottomCtaBar } from '@/components/navigation/BottomCtaBar'

export { buildThemeStyles }

/** Space for fixed `BottomCtaBar` so page content is not hidden behind it. */
const BODY_PAD_WITH_BOTTOM_CTA =
  'pb-[calc(4.25rem+env(safe-area-inset-bottom,0px))]'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const clientId = process.env.CLIENT_ID!
  const config = getClientConfig(clientId)
  const themeStyles = buildThemeStyles(resolveTheme(config.theme))
  const bottomBarItems = config.bottomActionBar?.items?.filter((i) => i.label?.trim() && i.href?.trim()) ?? []
  const showBottomCta = bottomBarItems.length > 0

  return (
    <html lang="es">
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeStyles }} />
      </head>
      <body
        className={showBottomCta ? BODY_PAD_WITH_BOTTOM_CTA : undefined}
        style={{ fontFamily: 'var(--font-body)', backgroundColor: 'var(--color-bg)' }}
      >
        {config.header && (
          <Navbar
            logo={config.header.logo}
            links={config.header.links}
            ctaLabel={config.header.ctaLabel}
            ctaAction={config.header.ctaAction}
          />
        )}
        {children}
        {config.footer && (
          <Footer
            columns={config.footer.columns}
            copyright={config.footer.copyright}
          />
        )}
        {showBottomCta && (
          <BottomCtaBar
            items={bottomBarItems}
            vendorScriptWidget={config.bottomActionBar?.vendorScriptWidget ?? null}
          />
        )}
      </body>
    </html>
  )
}
