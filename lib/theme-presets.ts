import type { ClientTheme } from '@/types/cms'

/**
 * A fully-specified theme — identical to ClientTheme but with all fields
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
    | 'pageInset'
    | 'sectionSpacing'
    | 'contentGap'
  >
> & {
  /** Duration for the carousel slide/fade transition. Mood-based default injected by buildThemeStyles. */
  carouselTransitionDuration?: string
}

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
    pageInset: 'clamp(1rem, 5vw, 2rem)',
    sectionSpacing: '6rem',
    contentGap: '1rem',
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
    pageInset: 'clamp(1.5rem, 6vw, 3rem)',
    sectionSpacing: '5rem',
    contentGap: '1rem',
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
    pageInset: 'clamp(1.5rem, 6vw, 3rem)',
    sectionSpacing: '5rem',
    contentGap: '1rem',
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
    pageInset: 'clamp(1rem, 4vw, 1.5rem)',
    sectionSpacing: '4rem',
    contentGap: '1rem',
  },

  /** Teal-blue primary, off-white background, humanist sans-serif for healthcare */
  'calm-healthcare': {
    primaryColor: '#0891b2',
    accentColor: '#06b6d4',
    backgroundColor: '#f0fafa',
    textColor: '#0c2a33',
    surfaceColor: '#ffffff',
    surfaceDark: '#064e63',
    fontHeading: 'Lato',
    fontBody: 'Lato',
    borderRadius: 6,
    pageInset: 'clamp(1rem, 5vw, 2rem)',
    sectionSpacing: '5rem',
    contentGap: '1rem',
  },

  /** Warm orange primary, sky blue accent, rounded corners for education */
  'bright-education': {
    primaryColor: '#f97316',
    accentColor: '#0ea5e9',
    backgroundColor: '#fffbf5',
    textColor: '#1c1917',
    surfaceColor: '#ffffff',
    surfaceDark: '#7c2d0e',
    fontHeading: 'Nunito',
    fontBody: 'Nunito',
    borderRadius: 12,
    pageInset: 'clamp(1rem, 4vw, 1.5rem)',
    sectionSpacing: '5rem',
    contentGap: '1rem',
  },

  /** Slate blue-gray primary, warm gold accent, editorial heading for real estate */
  'modern-realestate': {
    primaryColor: '#334155',
    accentColor: '#d4a847',
    backgroundColor: '#ffffff',
    textColor: '#1e293b',
    surfaceColor: '#f8fafc',
    surfaceDark: '#1e293b',
    fontHeading: 'Raleway',
    fontBody: 'Inter',
    borderRadius: 4,
    pageInset: 'clamp(1.5rem, 6vw, 2.5rem)',
    sectionSpacing: '5rem',
    contentGap: '1rem',
  },

  /** Terracotta primary, sand accent, luxury serif heading for boutique hospitality */
  'warm-hospitality': {
    primaryColor: '#c2714f',
    accentColor: '#e8c97e',
    backgroundColor: '#fdf6ee',
    textColor: '#2c1810',
    surfaceColor: '#ffffff',
    surfaceDark: '#6b3420',
    fontHeading: 'Cormorant Garamond',
    fontBody: 'Lato',
    borderRadius: 4,
    pageInset: 'clamp(1.5rem, 5vw, 2.5rem)',
    sectionSpacing: '6rem',
    contentGap: '1rem',
  },

  /** Charcoal primary, high-energy red accent, condensed heading for fitness */
  'strong-fitness': {
    primaryColor: '#1c1c1e',
    accentColor: '#ef4444',
    backgroundColor: '#f9f9f9',
    textColor: '#1c1c1e',
    surfaceColor: '#ffffff',
    surfaceDark: '#0a0a0a',
    fontHeading: 'Barlow Condensed',
    fontBody: 'Open Sans',
    borderRadius: 4,
    pageInset: 'clamp(0.75rem, 4vw, 1.5rem)',
    sectionSpacing: '4rem',
    contentGap: '1rem',
  },

  /** Deep indigo primary, coral-pink accent, editorial serif for creative studios */
  'creative-studio': {
    primaryColor: '#312e81',
    accentColor: '#f472b6',
    backgroundColor: '#faf9ff',
    textColor: '#1e1b4b',
    surfaceColor: '#ffffff',
    surfaceDark: '#1e1b4b',
    fontHeading: 'DM Serif Display',
    fontBody: 'DM Sans',
    borderRadius: 8,
    pageInset: 'clamp(1.5rem, 6vw, 3rem)',
    sectionSpacing: '5rem',
    contentGap: '1rem',
  },

  /** Forest green primary, amber accent, editorial serif for non-profits */
  'community-nonprofit': {
    primaryColor: '#166534',
    accentColor: '#f59e0b',
    backgroundColor: '#f0fdf4',
    textColor: '#14401f',
    surfaceColor: '#ffffff',
    surfaceDark: '#0d3d1e',
    fontHeading: 'Libre Baskerville',
    fontBody: 'Source Sans Pro',
    borderRadius: 8,
    pageInset: 'clamp(1rem, 5vw, 2rem)',
    sectionSpacing: '5rem',
    contentGap: '1rem',
  },

  /** Dark slate primary, safety-orange accent, bold condensed heading for trades */
  'industrial-trades': {
    primaryColor: '#1e293b',
    accentColor: '#ea580c',
    backgroundColor: '#fafaf9',
    textColor: '#1e293b',
    surfaceColor: '#ffffff',
    surfaceDark: '#0f172a',
    fontHeading: 'Oswald',
    fontBody: 'Roboto',
    borderRadius: 2,
    pageInset: 'clamp(1rem, 4vw, 1.5rem)',
    sectionSpacing: '5rem',
    contentGap: '1rem',
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
    pageInset: 'clamp(1rem, 5vw, 2rem)',
    sectionSpacing: '5rem',
    contentGap: '1rem',
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
  'calm-healthcare': {
    industries: ['healthcare', 'medical-clinic', 'dental', 'pharmacy', 'physiotherapy', 'mental-health', 'veterinary'],
    mood: ['calm', 'clean', 'trustworthy', 'caring', 'reassuring'],
    colorTemperature: 'cool',
    formality: 'medium',
    description: 'Teal blues and clean whites for medical and health service providers that need to project calm, cleanliness, and patient trust.',
  },
  'bright-education': {
    industries: ['education', 'tutoring', 'school', 'e-learning', 'coaching', 'childcare', 'university'],
    mood: ['energetic', 'optimistic', 'friendly', 'curious', 'approachable'],
    colorTemperature: 'warm',
    formality: 'low',
    description: 'Warm orange and sky blue for educational businesses and learning platforms that need to feel engaging, approachable, and encouraging.',
  },
  'modern-realestate': {
    industries: ['real-estate', 'property-management', 'mortgage', 'architecture', 'interior-design', 'home-staging'],
    mood: ['aspirational', 'confident', 'premium', 'trustworthy', 'contemporary'],
    colorTemperature: 'cool',
    formality: 'high',
    description: 'Slate blue-gray and warm gold for real estate agencies and property professionals projecting confidence and premium market positioning.',
  },
  'warm-hospitality': {
    industries: ['hotel', 'bed-and-breakfast', 'resort', 'vacation-rental', 'guesthouse', 'spa', 'retreat'],
    mood: ['welcoming', 'luxurious', 'warm', 'intimate', 'refined'],
    colorTemperature: 'warm',
    formality: 'medium',
    description: 'Terracotta and sand tones for boutique hotels and hospitality businesses that want to feel warm, curated, and memorable.',
  },
  'strong-fitness': {
    industries: ['gym', 'personal-training', 'sports-club', 'martial-arts', 'crossfit', 'yoga-studio', 'athletics'],
    mood: ['intense', 'powerful', 'motivating', 'energetic', 'bold'],
    colorTemperature: 'neutral',
    formality: 'low',
    description: 'High-contrast charcoal and red for gyms and fitness businesses that want to project intensity, performance, and results.',
  },
  'creative-studio': {
    industries: ['music', 'photography', 'film', 'art-gallery', 'design-studio', 'entertainment', 'performing-arts'],
    mood: ['artistic', 'expressive', 'contemporary', 'imaginative', 'distinctive'],
    colorTemperature: 'cool',
    formality: 'low',
    description: 'Deep indigo and coral pink for creative studios, artists, and entertainment businesses that need an expressive, editorial presence.',
  },
  'community-nonprofit': {
    industries: ['non-profit', 'charity', 'ngo', 'foundation', 'community-org', 'social-enterprise', 'volunteer'],
    mood: ['hopeful', 'mission-driven', 'warm', 'trustworthy', 'community-focused'],
    colorTemperature: 'cool',
    formality: 'medium',
    description: 'Forest green and amber for non-profit organizations and charities that need to feel credible, mission-driven, and community-rooted.',
  },
  'industrial-trades': {
    industries: ['construction', 'contracting', 'plumbing', 'electrical', 'roofing', 'landscaping', 'home-services'],
    mood: ['reliable', 'strong', 'no-nonsense', 'professional', 'dependable'],
    colorTemperature: 'neutral',
    formality: 'medium',
    description: 'Dark slate and safety orange for construction firms and trade businesses that need to project rugged reliability and professional competence.',
  },
  default: {
    industries: [],
    mood: ['neutral'],
    colorTemperature: 'neutral',
    formality: 'medium',
    description: 'Generic fallback preset. Use a specific preset whenever possible.',
  },
}
