import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatsBlock from '@/components/blocks/StatsBlock'
import type { StatItem } from '@/types/cms'

const stats: StatItem[] = [
  { value: '500+', label: 'Clients served' },
  { value: '98%', label: 'Satisfaction rate' },
  { value: '10yr', label: 'In business' },
]

describe('StatsBlock', () => {
  it.each(stats)('renders stat value "$value" and label "$label"', ({ value, label }) => {
    render(<StatsBlock _type="statsBlock" stats={stats} />)
    expect(screen.getByText(value)).toBeInTheDocument()
    expect(screen.getByText(label)).toBeInTheDocument()
  })

  it('wraps content in a data-component="stats-block" element', () => {
    const { container } = render(<StatsBlock _type="statsBlock" stats={stats} />)
    expect(
      container.querySelector('[data-component="stats-block"]')
    ).toBeInTheDocument()
  })
})
