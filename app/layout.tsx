import './globals.css'
import { getClientConfig, resolveTheme } from '@/lib/client-config'
import type { ThemePreset } from '@/lib/theme-presets'
import { Navbar } from '@/components/navigation/Navbar'
import { Footer } from '@/components/navigation/Footer'

// Exported for unit testing without rendering the full layout tree
export function buildThemeStyles(theme: ThemePreset): string {
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
    }
  `
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const clientId = process.env.CLIENT_ID!
  const config = getClientConfig(clientId)
  const themeStyles = buildThemeStyles(resolveTheme(config.theme))

  return (
    <html lang="es">
      <head>
        <style dangerouslySetInnerHTML={{ __html: themeStyles }} />
      </head>
      <body style={{ fontFamily: 'var(--font-body)', backgroundColor: 'var(--color-bg)' }}>
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
      </body>
    </html>
  )
}
