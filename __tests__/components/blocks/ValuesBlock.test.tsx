import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ValuesBlock from '@/components/blocks/ValuesBlock'
import type { ValueCard } from '@/types/cms'

const items: ValueCard[] = [
  { title: 'Transparency', description: 'We are open about how we work.', icon: '🔍' },
  { title: 'Quality', description: 'We never cut corners.', icon: null },
  { title: 'Speed', description: 'We deliver on time, every time.' },
]

describe('ValuesBlock', () => {
  it('renders all value titles', () => {
    render(<ValuesBlock _type="valuesBlock" items={items} />)
    // Each title appears as both an h3 heading and a Badge — use getAllByText
    expect(screen.getAllByText('Transparency').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Quality').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Speed').length).toBeGreaterThanOrEqual(1)
  })

  it('renders all value descriptions', () => {
    render(<ValuesBlock _type="valuesBlock" items={items} />)
    expect(screen.getByText('We are open about how we work.')).toBeInTheDocument()
    expect(screen.getByText('We never cut corners.')).toBeInTheDocument()
    expect(screen.getByText('We deliver on time, every time.')).toBeInTheDocument()
  })

  it('renders icons when provided', () => {
    render(<ValuesBlock _type="valuesBlock" items={items} />)
    expect(screen.getByText('🔍')).toBeInTheDocument()
  })

  it('renders the optional section heading', () => {
    render(
      <ValuesBlock _type="valuesBlock" heading="Our Core Values" items={items} />
    )
    expect(
      screen.getByRole('heading', { name: 'Our Core Values' })
    ).toBeInTheDocument()
  })

  it('does not render a section heading when heading is omitted', () => {
    render(<ValuesBlock _type="valuesBlock" items={items} />)
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument()
  })

  it('wraps content in a data-component="values-block" element', () => {
    const { container } = render(<ValuesBlock _type="valuesBlock" items={items} />)
    expect(
      container.querySelector('[data-component="values-block"]')
    ).toBeInTheDocument()
  })
})
