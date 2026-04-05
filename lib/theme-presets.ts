import type { ClientTheme } from '@/types/cms'

/**
 * A fully-specified theme — identical to ClientTheme but with all 6 fields
 * required and no optional `preset` key.
 */
export type ThemePreset = Required<
  Pick<
    ClientTheme,
    'primaryColor' | 'accentColor' | 'backgroundColor' | 'fontHeading' | 'fontBody' | 'borderRadius'
  >
>

export const THEME_PRESETS: Record<string, ThemePreset> = {
  /** Warm reds, serif heading font, soft cream background */
  'bold-restaurant': {
    primaryColor: '#c0392b',
    accentColor: '#e74c3c',
    backgroundColor: '#fdf8f2',
    fontHeading: 'Playfair Display',
    fontBody: 'Inter',
    borderRadius: 4,
  },

  /** Neutral grays, clean sans-serif fonts, sharp corners */
  'modern-minimal': {
    primaryColor: '#1a1a1a',
    accentColor: '#6b7280',
    backgroundColor: '#ffffff',
    fontHeading: 'Inter',
    fontBody: 'Inter',
    borderRadius: 2,
  },

  /** Deep navy, gold accent, conservative serif heading, white background */
  'professional-law': {
    primaryColor: '#1a2e4a',
    accentColor: '#b8972e',
    backgroundColor: '#ffffff',
    fontHeading: 'Merriweather',
    fontBody: 'Source Sans Pro',
    borderRadius: 2,
  },

  /** Bright accent color, bold sans-serif, high contrast */
  'vibrant-retail': {
    primaryColor: '#7c3aed',
    accentColor: '#f59e0b',
    backgroundColor: '#ffffff',
    fontHeading: 'Poppins',
    fontBody: 'Poppins',
    borderRadius: 8,
  },

  /** Safe fallback used when no preset is specified and not all fields are explicit */
  default: {
    primaryColor: '#2563eb',
    accentColor: '#3b82f6',
    backgroundColor: '#ffffff',
    fontHeading: 'Inter',
    fontBody: 'Inter',
    borderRadius: 4,
  },
}

export function getPreset(name: string): ThemePreset | undefined {
  return THEME_PRESETS[name]
}
