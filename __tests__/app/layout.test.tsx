import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import React from 'react'

// vi.mock factories are hoisted, so we cannot reference variables declared in
// the module body. Use vi.fn() inline and retrieve the mock later via vi.mocked().

vi.mock('@/lib/client-config', () => ({
  getClientConfig: vi.fn(),
  // resolveTheme is called in RootLayout; pass the theme object straight through
  resolveTheme: vi.fn((theme: unknown) => theme),
}))

vi.mock('@/components/navigation/Navbar', () => ({
  Navbar: ({ logo }: { logo: string }) => <nav data-testid="navbar">{logo}</nav>,
}))

vi.mock('@/components/navigation/Footer', () => ({
  Footer: ({ copyright }: { copyright?: string | null }) => (
    <footer data-testid="footer">{copyright}</footer>
  ),
}))

vi.mock('@/components/navigation/BottomCtaBar', () => ({
  BottomCtaBar: () => <nav aria-label="Quick actions">bottom-cta</nav>,
}))

import { buildThemeStyles } from '@/app/layout'
import RootLayout from '@/app/layout'
import SiteLayout from '@/app/(site)/layout'
import { getClientConfig } from '@/lib/client-config'
import type { ThemePreset } from '@/lib/theme-presets'

// ---------------------------------------------------------------------------
// Shared resolved theme
// ---------------------------------------------------------------------------
const resolvedTheme = {
  primaryColor: '#c0392b',
  accentColor: '#e74c3c',
  backgroundColor: '#fdf8f2',
  textColor: '#2d1a0e',
  surfaceColor: '#ffffff',
  surfaceDark: '#3b1c14',
  fontHeading: 'Playfair Display',
  fontBody: 'Inter',
  borderRadius: 4,
  pageInset: 'clamp(1rem, 5vw, 2rem)',
  sectionSpacing: '6rem',
  contentGap: '1rem',
}

const mockGetClientConfig = vi.mocked(getClientConfig)

const baseConfig = {
  clientId: 'restaurante-pepe',
  displayName: 'Restaurante Pepe',
  customDomain: 'restaurante-pepe.com',
  swaResourceName: 'swa-restaurante-pepe',
  features: { blog: false, booking: true, gallery: true, menu: true },
  theme: resolvedTheme,
  pages: [],
}

// ---------------------------------------------------------------------------
// buildThemeStyles
// ---------------------------------------------------------------------------
describe('buildThemeStyles', () => {
  it('emits CSS variable declarations for all theme properties', () => {
    const css = buildThemeStyles(resolvedTheme)

    expect(css).toContain('--color-primary: #c0392b')
    expect(css).toContain('--color-accent: #e74c3c')
    expect(css).toContain('--color-bg: #fdf8f2')
    expect(css).toContain('--color-text: #2d1a0e')
    expect(css).toContain('--color-surface: #ffffff')
    expect(css).toContain('--color-surface-dark: #3b1c14')
    expect(css).toContain("--font-heading: 'Playfair Display'")
    expect(css).toContain("--font-body: 'Inter'")
    expect(css).toContain('--radius: 4px')
    expect(css).toContain('--page-inset: clamp(1rem, 5vw, 2rem)')
    expect(css).toContain('--section-spacing: 6rem')
    expect(css).toContain('--content-gap: 1rem')
  })

  it.each([
    [
      'explicit carouselTransitionDuration',
      { ...resolvedTheme, carouselTransitionDuration: '800ms' } satisfies ThemePreset,
      '800ms',
    ],
    [
      'high-formality law palette',
      { ...resolvedTheme, primaryColor: '#1a2e4a' } satisfies ThemePreset,
      '600ms',
    ],
    [
      'high-formality realestate palette',
      { ...resolvedTheme, primaryColor: '#334155' } satisfies ThemePreset,
      '600ms',
    ],
    [
      'high-energy fitness palette',
      {
        ...resolvedTheme,
        primaryColor: '#1c1c1e',
        accentColor: '#ef4444',
      } satisfies ThemePreset,
      '250ms',
    ],
    [
      'high-energy retail palette',
      { ...resolvedTheme, primaryColor: '#7c3aed' } satisfies ThemePreset,
      '250ms',
    ],
    ['default mood', { ...resolvedTheme, primaryColor: '#112233', accentColor: '#445566' } satisfies ThemePreset, '400ms'],
  ] as const)('sets --carousel-transition-duration for %s', (_label, theme, expected) => {
    const css = buildThemeStyles(theme)
    expect(css).toContain(`--carousel-transition-duration: ${expected}`)
  })
})

// ---------------------------------------------------------------------------
// RootLayout default export
// ---------------------------------------------------------------------------
describe('RootLayout', () => {
  it('renders children inside the html/body shell', () => {
    process.env.CLIENT_ID = 'restaurante-pepe'
    mockGetClientConfig.mockReturnValue({ ...baseConfig, header: null, footer: null })

    const { getByTestId } = render(
      <RootLayout>
        <main data-testid="child">content</main>
      </RootLayout>
    )

    expect(getByTestId('child')).toBeTruthy()
  })

  it('does not render Navbar (site chrome lives in app/(site)/layout)', () => {
    process.env.CLIENT_ID = 'restaurante-pepe'
    mockGetClientConfig.mockReturnValue({
      ...baseConfig,
      header: { logo: 'Pepe', links: [], ctaLabel: 'Book', ctaAction: '/book' },
      footer: null,
    })

    const { queryByTestId } = render(
      <RootLayout>
        <span />
      </RootLayout>
    )

    expect(queryByTestId('navbar')).toBeNull()
  })

  it('does not render Navbar when config.header is absent', () => {
    process.env.CLIENT_ID = 'restaurante-pepe'
    mockGetClientConfig.mockReturnValue({ ...baseConfig, header: null, footer: null })

    const { queryByTestId } = render(
      <RootLayout>
        <span />
      </RootLayout>
    )

    expect(queryByTestId('navbar')).toBeNull()
  })

  it('does not render Footer (site chrome lives in app/(site)/layout)', () => {
    process.env.CLIENT_ID = 'restaurante-pepe'
    mockGetClientConfig.mockReturnValue({
      ...baseConfig,
      header: null,
      footer: { columns: [], copyright: '© 2024 Pepe' },
    })

    const { queryByTestId } = render(
      <RootLayout>
        <span />
      </RootLayout>
    )

    expect(queryByTestId('footer')).toBeNull()
  })

  it('does not render Footer when config.footer is absent', () => {
    process.env.CLIENT_ID = 'restaurante-pepe'
    mockGetClientConfig.mockReturnValue({ ...baseConfig, header: null, footer: null })

    const { queryByTestId } = render(
      <RootLayout>
        <span />
      </RootLayout>
    )

    expect(queryByTestId('footer')).toBeNull()
  })

  it('injects theme CSS variables into the <style> tag', () => {
    process.env.CLIENT_ID = 'restaurante-pepe'
    mockGetClientConfig.mockReturnValue({ ...baseConfig, header: null, footer: null })

    render(
      <RootLayout>
        <span />
      </RootLayout>
    )

    // jsdom hoists <head> content into document.head, not into container
    const styleEl = document.head.querySelector('style')
    expect(styleEl).not.toBeNull()
    expect(styleEl!.innerHTML).toContain('--color-primary: #c0392b')
  })

  it('does not add BottomCtaBar padding on its own', () => {
    process.env.CLIENT_ID = 'restaurante-pepe'
    mockGetClientConfig.mockReturnValue({
      ...baseConfig,
      header: null,
      footer: null,
      bottomActionBar: {
        items: [
          { label: 'Call', href: 'tel:+1' },
          { label: '   ', href: '/empty-label' },
          { label: 'Chat', href: '' },
        ],
      },
    })

    render(
      <RootLayout>
        <span />
      </RootLayout>
    )

    expect(document.body.className).not.toMatch(/pb-\[calc/)
    expect(document.querySelector('[aria-label="Quick actions"]')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Site layout — public marketing chrome (Navbar / Footer / BottomCtaBar)
// ---------------------------------------------------------------------------
describe('SiteLayout (app/(site)/layout)', () => {
  it('renders Navbar when config.header is present', () => {
    process.env.CLIENT_ID = 'restaurante-pepe'
    mockGetClientConfig.mockReturnValue({
      ...baseConfig,
      header: { logo: 'Pepe', links: [], ctaLabel: 'Book', ctaAction: '/book' },
      footer: null,
    })

    const { getByTestId } = render(
      <SiteLayout>
        <span data-testid="child" />
      </SiteLayout>
    )

    expect(getByTestId('navbar')).toBeTruthy()
  })

  it('does not render Navbar when config.header is absent', () => {
    process.env.CLIENT_ID = 'restaurante-pepe'
    mockGetClientConfig.mockReturnValue({ ...baseConfig, header: null, footer: null })

    const { queryByTestId } = render(
      <SiteLayout>
        <span />
      </SiteLayout>
    )

    expect(queryByTestId('navbar')).toBeNull()
  })

  it('renders Footer when config.footer is present', () => {
    process.env.CLIENT_ID = 'restaurante-pepe'
    mockGetClientConfig.mockReturnValue({
      ...baseConfig,
      header: null,
      footer: { columns: [], copyright: '© 2024 Pepe' },
    })

    const { getByTestId } = render(
      <SiteLayout>
        <span />
      </SiteLayout>
    )

    expect(getByTestId('footer')).toBeTruthy()
  })

  it('adds inner padding and renders BottomCtaBar when filtered action items exist', () => {
    process.env.CLIENT_ID = 'restaurante-pepe'
    mockGetClientConfig.mockReturnValue({
      ...baseConfig,
      header: null,
      footer: null,
      bottomActionBar: {
        items: [
          { label: 'Call', href: 'tel:+1' },
          { label: '   ', href: '/empty-label' },
          { label: 'Chat', href: '' },
        ],
      },
    })

    const { getByTestId } = render(
      <SiteLayout>
        <main data-testid="main">content</main>
      </SiteLayout>
    )

    const main = getByTestId('main')
    expect(main.parentElement?.className ?? '').toMatch(/pb-\[calc/)
    expect(document.querySelector('[aria-label="Quick actions"]')).toBeInTheDocument()
  })

  it('omits BottomCtaBar when no valid bottomActionBar items remain after filtering', () => {
    process.env.CLIENT_ID = 'restaurante-pepe'
    mockGetClientConfig.mockReturnValue({
      ...baseConfig,
      header: null,
      footer: null,
      bottomActionBar: {
        items: [{ label: '', href: '/x' }],
      },
    })

    const { getByTestId } = render(
      <SiteLayout>
        <main data-testid="main">content</main>
      </SiteLayout>
    )

    const main = getByTestId('main')
    expect(main.parentElement?.className ?? '').not.toMatch(/pb-\[calc/)
    expect(document.querySelector('[aria-label="Quick actions"]')).toBeNull()
  })
})
