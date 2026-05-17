import './globals.css'
import { getClientConfig, resolveTheme } from '@/lib/client-config'
import { buildThemeStyles } from '@/lib/theme-utils'

export { buildThemeStyles }

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
        {children}
      </body>
    </html>
  )
}
