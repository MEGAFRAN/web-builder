import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FeatureGrid } from '@/components/sections/FeatureGrid'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FEATURES = [
  { icon: '🚀', title: 'Fast', description: 'Blazing fast performance' },
  { icon: '🔒', title: 'Secure', description: 'Enterprise-grade security' },
  { title: 'Simple', description: 'Easy to use interface' }, // no icon
]

const COLS_CASES = [
  ['2', 'sm:grid-cols-2'],
  ['3', 'sm:grid-cols-3'],
] as const

// ─── Helper ───────────────────────────────────────────────────────────────────

function renderFeatureGrid(props: React.ComponentProps<typeof FeatureGrid>) {
  const { container } = render(<FeatureGrid {...props} />)
  return container
}

function getRoot(container: HTMLElement) {
  return container.querySelector('div[data-component="feature-grid"]') as HTMLDivElement
}

function getGrid(container: HTMLElement) {
  return getRoot(container).querySelector('.grid') as HTMLDivElement
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('FeatureGrid', () => {
  describe('root element', () => {
    it('renders a <div> with data-component="feature-grid"', () => {
      const container = renderFeatureGrid({ features: FEATURES })
      expect(getRoot(container)).not.toBeNull()
    })
  })

  describe('title prop', () => {
    it('renders an <h2> with the title when provided', () => {
      renderFeatureGrid({ title: 'Our Features', features: FEATURES })
      expect(screen.getByRole('heading', { level: 2, name: 'Our Features' })).toBeInTheDocument()
    })

    it('does not render an <h2> when title is omitted', () => {
      const container = renderFeatureGrid({ features: FEATURES })
      expect(container.querySelector('h2')).toBeNull()
    })

    it('does not render an <h2> when title={null}', () => {
      const container = renderFeatureGrid({ title: null, features: FEATURES })
      expect(container.querySelector('h2')).toBeNull()
    })
  })

  describe('subtitle prop', () => {
    it('renders a subtitle <p> when subtitle is provided', () => {
      renderFeatureGrid({ subtitle: 'Everything you need', features: FEATURES })
      expect(screen.getByText('Everything you need').tagName).toBe('P')
    })

    it('does not render subtitle when omitted', () => {
      renderFeatureGrid({ features: FEATURES })
      expect(screen.queryByText('Everything you need')).not.toBeInTheDocument()
    })

    it('does not render subtitle when subtitle={null}', () => {
      renderFeatureGrid({ subtitle: null, features: FEATURES })
      expect(screen.queryByText('Everything you need')).not.toBeInTheDocument()
    })

    it('renders both title and subtitle when both are provided', () => {
      renderFeatureGrid({ title: 'Features', subtitle: 'All you need', features: FEATURES })
      expect(screen.getByRole('heading', { level: 2, name: 'Features' })).toBeInTheDocument()
      expect(screen.getByText('All you need')).toBeInTheDocument()
    })
  })

  describe('features rendering', () => {
    it('renders an <h3> for each feature title', () => {
      renderFeatureGrid({ features: FEATURES })
      FEATURES.forEach(({ title }) => {
        expect(screen.getByRole('heading', { level: 3, name: title })).toBeInTheDocument()
      })
    })

    it('renders a <p> for each feature description', () => {
      renderFeatureGrid({ features: FEATURES })
      FEATURES.forEach(({ description }) => {
        expect(screen.getByText(description)).toBeInTheDocument()
      })
    })

    it('renders icon as a <span> when icon is provided', () => {
      renderFeatureGrid({ features: FEATURES })
      // Two features have icons
      expect(screen.getByText('🚀')).toBeInTheDocument()
      expect(screen.getByText('🔒')).toBeInTheDocument()
    })

    it('does not render an icon <span> when icon is omitted on a feature', () => {
      const container = renderFeatureGrid({ features: [{ title: 'No icon', description: 'Desc' }] })
      // There should be no span with an emoji
      const iconSpans = container.querySelectorAll('span.text-2xl')
      expect(iconSpans).toHaveLength(0)
    })
  })

  describe('cols prop', () => {
    it.each(COLS_CASES)('cols="%s" applies "%s" class to the grid', (cols, expectedClass) => {
      const container = renderFeatureGrid({ features: FEATURES, cols })
      expect(getGrid(container).className).toContain(expectedClass)
    })

    it('defaults to 3-column grid when cols is omitted and feature count is not 4', () => {
      const container = renderFeatureGrid({ features: FEATURES })
      expect(getGrid(container).className).toContain('sm:grid-cols-3')
    })

    it('defaults to 3-column grid when cols={null} and feature count is not 4', () => {
      const container = renderFeatureGrid({ features: FEATURES, cols: null })
      expect(getGrid(container).className).toContain('sm:grid-cols-3')
    })

    it('uses 2-column grid when cols is omitted and there are exactly 4 features', () => {
      const fourFeatures = [
        ...FEATURES,
        { title: 'Reliable', description: 'Always available' },
      ]
      const container = renderFeatureGrid({ features: fourFeatures })
      expect(getGrid(container).className).toContain('sm:grid-cols-2')
      expect(getGrid(container).className).not.toContain('sm:grid-cols-3')
    })

    it('uses 2-column grid when cols={null} and there are exactly 4 features', () => {
      const fourFeatures = [
        ...FEATURES,
        { title: 'Reliable', description: 'Always available' },
      ]
      const container = renderFeatureGrid({ features: fourFeatures, cols: null })
      expect(getGrid(container).className).toContain('sm:grid-cols-2')
    })

    it('preserves explicit cols="3" when there are 4 features', () => {
      const fourFeatures = [
        ...FEATURES,
        { title: 'Reliable', description: 'Always available' },
      ]
      const container = renderFeatureGrid({ features: fourFeatures, cols: '3' })
      expect(getGrid(container).className).toContain('sm:grid-cols-3')
    })

    it('falls back to 3-column grid for an unrecognised cols value', () => {
      const container = renderFeatureGrid({ features: FEATURES, cols: '5' })
      expect(getGrid(container).className).toContain('sm:grid-cols-3')
    })
  })

  describe('combined props', () => {
    it('renders title, subtitle, and all feature cards together', () => {
      renderFeatureGrid({ title: 'Features', subtitle: 'All included', features: FEATURES, cols: '3' })
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
      expect(screen.getByText('All included')).toBeInTheDocument()
      expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(FEATURES.length)
    })
  })
})
