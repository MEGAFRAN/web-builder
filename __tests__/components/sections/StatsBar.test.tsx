import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatsBar } from '@/components/sections/StatsBar'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const STATS_2 = [
  { value: '100K+', label: 'Users' },
  { value: '99.9%', label: 'Uptime' },
]

const STATS_3 = [
  { value: '100K+', label: 'Users' },
  { value: '99.9%', label: 'Uptime' },
  { value: '$5M+',  label: 'Revenue' },
]

const STATS_4 = [
  { value: '100K+', label: 'Users' },
  { value: '99.9%', label: 'Uptime' },
  { value: '$5M+',  label: 'Revenue' },
  { value: '4.9',   label: 'Rating' },
]

const BACKGROUND_CASES = [
  ['white', 'text-brand',      'text-muted'],
  ['gray',  'text-foreground', 'text-muted'],
  ['dark',  'text-primary-fg', 'text-primary-fg-muted'],
] as const

// ─── Helper ───────────────────────────────────────────────────────────────────

function renderStatsBar(props: React.ComponentProps<typeof StatsBar>) {
  const { container } = render(<StatsBar {...props} />)
  return container
}

function getDl(container: HTMLElement) {
  return container.querySelector('dl') as HTMLDListElement
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('StatsBar', () => {
  describe('stats rendering', () => {
    it('renders a <dl> containing the stats', () => {
      const container = renderStatsBar({ stats: STATS_2 })
      expect(getDl(container)).not.toBeNull()
    })

    it('renders the value for each stat as a <dt>', () => {
      renderStatsBar({ stats: STATS_4 })
      STATS_4.forEach(({ value }) => {
        expect(screen.getByText(value).closest('dt')).not.toBeNull()
      })
    })

    it('renders the label for each stat as a <dd>', () => {
      renderStatsBar({ stats: STATS_4 })
      STATS_4.forEach(({ label }) => {
        expect(screen.getByText(label).tagName).toBe('DD')
      })
    })
  })

  describe('grid columns', () => {
    it.each([
      [STATS_2, 'grid-cols-2'],
      [STATS_3, 'grid-cols-3'],
      [STATS_4, 'grid-cols-4'],
    ] as const)('renders correct grid column class for %i stats', (stats, expectedClass) => {
      const container = renderStatsBar({ stats: [...stats] })
      expect(getDl(container).className).toContain(expectedClass)
    })

    it('caps grid columns at 4 even when more than 4 stats are provided', () => {
      const fiveStats = [...STATS_4, { value: '50+', label: 'Countries' }]
      const container = renderStatsBar({ stats: fiveStats })
      expect(getDl(container).className).toContain('grid-cols-4')
    })
  })

  describe('background prop', () => {
    it.each(BACKGROUND_CASES)(
      'background="%s" applies "%s" to value and "%s" to label',
      (background, valueClass, labelClass) => {
        renderStatsBar({ stats: [{ value: '100', label: 'Things' }], background })
        const dt = screen.getByText('100').closest('dt')!
        const dd = screen.getByText('Things')
        expect(dt.className).toContain(valueClass)
        expect(dd.className).toContain(labelClass)
      }
    )

    it('defaults to white background when background is omitted', () => {
      renderStatsBar({ stats: [{ value: '1', label: 'Thing' }] })
      const dt = screen.getByText('1').closest('dt')!
      expect(dt.className).toContain('text-brand')
    })

    it('defaults to white background when background={null}', () => {
      renderStatsBar({ stats: [{ value: '1', label: 'Thing' }], background: null })
      const dt = screen.getByText('1').closest('dt')!
      expect(dt.className).toContain('text-brand')
    })

    it('falls back to white for an unrecognised background value', () => {
      renderStatsBar({ stats: [{ value: '1', label: 'Thing' }], background: 'purple' })
      const dt = screen.getByText('1').closest('dt')!
      expect(dt.className).toContain('text-foreground')
    })
  })

  describe('empty stats', () => {
    it('uses grid-cols-4 fallback when stats is empty so layout stays valid', () => {
      const container = renderStatsBar({ stats: [] })
      expect(getDl(container).className).toContain('grid-cols-4')
    })

    it('uses grid-cols-4 fallback when stats is undefined', () => {
      const container = renderStatsBar({
        stats: undefined as unknown as typeof STATS_2,
      })
      expect(getDl(container).className).toContain('grid-cols-4')
    })
  })
})
