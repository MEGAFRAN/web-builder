import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/client-config', () => ({
  getClientConfig: vi.fn(() => ({
    clientId: 'restaurante-pepe',
    displayName: 'Restaurante Pepe',
    sanityDataset: 'restaurante-pepe-prod',
    customDomain: 'restaurante-pepe.com',
    swaResourceName: 'swa-restaurante-pepe',
    features: { blog: false, booking: true, gallery: true, menu: true },
    theme: {
      primaryColor: '#c0392b',
      accentColor: '#e74c3c',
      backgroundColor: '#fdf8f2',
      fontHeading: 'Playfair Display',
      fontBody: 'Inter',
      borderRadius: 4,
    },
  })),
}))

import { buildThemeStyles } from '@/app/layout'

describe('buildThemeStyles', () => {
  it('emits CSS variable declarations for all theme properties', () => {
    const css = buildThemeStyles({
      primaryColor: '#c0392b',
      accentColor: '#e74c3c',
      backgroundColor: '#fdf8f2',
      fontHeading: 'Playfair Display',
      fontBody: 'Inter',
      borderRadius: 4,
    })

    expect(css).toContain('--color-primary: #c0392b')
    expect(css).toContain('--color-accent: #e74c3c')
    expect(css).toContain('--color-bg: #fdf8f2')
    expect(css).toContain("--font-heading: 'Playfair Display'")
    expect(css).toContain("--font-body: 'Inter'")
    expect(css).toContain('--radius: 4px')
  })
})
