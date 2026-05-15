import type { ThemePreset } from '@/lib/theme-presets'

function resolveCarouselTransitionDuration(theme: ThemePreset): string {
  if (theme.carouselTransitionDuration) return theme.carouselTransitionDuration
  const isHighFormality =
    theme.primaryColor === '#1a2e4a' ||
    theme.primaryColor === '#334155'
  const isHighEnergy =
    (theme.primaryColor === '#1c1c1e' && theme.accentColor === '#ef4444') ||
    theme.primaryColor === '#7c3aed'
  if (isHighFormality) return '600ms'
  if (isHighEnergy) return '250ms'
  return '400ms'
}

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
