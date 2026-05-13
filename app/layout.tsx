import './globals.css'
import { getClientConfig, resolveTheme } from '@/lib/client-config'
import type { ThemePreset } from '@/lib/theme-presets'
import { Navbar } from '@/components/navigation/Navbar'
import { Footer } from '@/components/navigation/Footer'
import { BottomCtaBar } from '@/components/navigation/BottomCtaBar'

/**
 * Derives the carousel transition duration from mood-based preset metadata.
 * - formality:high presets (professional-law, modern-realestate) → 600ms (measured, formal)
 * - high-energy presets (strong-fitness, vibrant-retail) → 250ms (snappy)
 * - All others → 400ms
 * An explicit `carouselTransitionDuration` on the preset always takes precedence.
 */
function resolveCarouselTransitionDuration(theme: ThemePreset): string {
  if (theme.carouselTransitionDuration) return theme.carouselTransitionDuration
  // Identify preset by its unique combination of colors (no preset name stored on ThemePreset)
  const isHighFormality =
    (theme.primaryColor === '#1a2e4a') || // professional-law
    (theme.primaryColor === '#334155')    // modern-realestate
  const isHighEnergy =
    (theme.primaryColor === '#1c1c1e' && theme.accentColor === '#ef4444') || // strong-fitness
    (theme.primaryColor === '#7c3aed')                                         // vibrant-retail
  if (isHighFormality) return '600ms'
  if (isHighEnergy) return '250ms'
  return '400ms'
}

// Exported for unit testing without rendering the full layout tree
export function buildThemeStyles(theme: ThemePreset): string {
  const carouselDuration = resolveCarouselTransitionDuration(theme)
  return `
    :root {
      --color-primary: ${theme.primaryColor};
      --color-accent: ${theme.accentColor};
      --color-bg: ${theme.backgroundColor};
      --color-text: ${theme.textColor};
      --color-surface: ${theme.surfaceColor};
      --color-surface-dark: ${theme.surfaceDark};
      --font-heading: '${theme.fontHeading}', serif;
      --font-body: '${theme.fontBody}', sans-serif;
      --radius: ${theme.borderRadius}px;
      --page-inset: ${theme.pageInset};
      --section-spacing: ${theme.sectionSpacing};
      --content-gap: ${theme.contentGap};
      --carousel-transition-duration: ${carouselDuration};
    }
  `
}

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
