import type { ClientTheme } from '@/types/cms'

/**
 * A fully-specified theme — identical to ClientTheme but with all 9 fields
 * required and no optional `preset` key.
 */
export type ThemePreset = Required<
  Pick<
    ClientTheme,
    | 'primaryColor'
    | 'accentColor'
    | 'backgroundColor'
    | 'textColor'
    | 'surfaceColor'
    | 'surfaceDark'
    | 'fontHeading'
    | 'fontBody'
    | 'borderRadius'
  >
>

export const THEME_PRESETS: Record<string, ThemePreset> = {
  /** Warm reds, serif heading font, soft cream background */
  'bold-restaurant': {
    primaryColor: '#c0392b',
    accentColor: '#e74c3c',
    backgroundColor: '#fdf8f2',
    textColor: '#2d1a0e',
    surfaceColor: '#ffffff',
    surfaceDark: '#3b1c14',
    fontHeading: 'Playfair Display',
    fontBody: 'Inter',
    borderRadius: 4,
  },

  /** Neutral grays, clean sans-serif fonts, sharp corners */
  'modern-minimal': {
    primaryColor: '#1a1a1a',
    accentColor: '#6b7280',
    backgroundColor: '#ffffff',
    textColor: '#1a1a1a',
    surfaceColor: '#f9fafb',
    surfaceDark: '#1a1a1a',
    fontHeading: 'Inter',
    fontBody: 'Inter',
    borderRadius: 2,
  },

  /** Deep navy, gold accent, conservative serif heading, white background */
  'professional-law': {
    primaryColor: '#1a2e4a',
    accentColor: '#b8972e',
    backgroundColor: '#ffffff',
    textColor: '#1a2e4a',
    surfaceColor: '#f8f9fc',
    surfaceDark: '#1a2e4a',
    fontHeading: 'Merriweather',
    fontBody: 'Source Sans Pro',
    borderRadius: 2,
  },

  /** Bright accent color, bold sans-serif, high contrast */
  'vibrant-retail': {
    primaryColor: '#7c3aed',
    accentColor: '#f59e0b',
    backgroundColor: '#ffffff',
    textColor: '#18181b',
    surfaceColor: '#faf5ff',
    surfaceDark: '#4c1d95',
    fontHeading: 'Poppins',
    fontBody: 'Poppins',
    borderRadius: 8,
  },

  /** Safe fallback used when no preset is specified and not all fields are explicit */
  default: {
    primaryColor: '#2563eb',
    accentColor: '#3b82f6',
    backgroundColor: '#ffffff',
    textColor: '#111827',
    surfaceColor: '#f9fafb',
    surfaceDark: '#1e3a5f',
    fontHeading: 'Inter',
    fontBody: 'Inter',
    borderRadius: 4,
  },
}

export function getPreset(name: string): ThemePreset | undefined {
  return THEME_PRESETS[name]
}

export type ThemePresetMeta = {
  industries: string[]
  mood: string[]
  colorTemperature: 'warm' | 'cool' | 'neutral'
  formality: 'high' | 'medium' | 'low'
  description: string
}

export const THEME_PRESET_META: Record<string, ThemePresetMeta> = {
  'bold-restaurant': {
    industries: ['restaurant', 'cafe', 'bar', 'catering', 'food-service', 'bakery'],
    mood: ['warm', 'bold', 'inviting', 'traditional', 'appetizing'],
    colorTemperature: 'warm',
    formality: 'medium',
    description:
      'Warm reds and cream tones for food-service businesses that want an appetizing, energetic feel.',
  },
  'modern-minimal': {
    industries: ['technology', 'saas', 'agency', 'design', 'photography', 'freelance'],
    mood: ['clean', 'modern', 'neutral', 'professional', 'understated'],
    colorTemperature: 'neutral',
    formality: 'medium',
    description:
      'Neutral grays and clean typography for tech and creative businesses that want to let content speak.',
  },
  'professional-law': {
    industries: ['law', 'finance', 'consulting', 'insurance', 'accounting', 'banking', 'real-estate'],
    mood: ['authoritative', 'conservative', 'trustworthy', 'formal', 'prestigious'],
    colorTemperature: 'cool',
    formality: 'high',
    description:
      'Deep navy and gold for professional services firms that need to project authority and trust.',
  },
  'vibrant-retail': {
    industries: ['retail', 'e-commerce', 'fashion', 'beauty', 'wellness', 'fitness', 'entertainment'],
    mood: ['energetic', 'bold', 'playful', 'youthful', 'vibrant'],
    colorTemperature: 'neutral',
    formality: 'low',
    description:
      'Bright purple and amber for retail and lifestyle brands targeting younger, energetic audiences.',
  },
  default: {
    industries: [],
    mood: ['neutral'],
    colorTemperature: 'neutral',
    formality: 'medium',
    description: 'Generic fallback preset. Use a specific preset whenever possible.',
  },
}
