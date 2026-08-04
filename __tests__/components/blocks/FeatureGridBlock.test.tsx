import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import FeatureGridBlock from '@/components/blocks/FeatureGridBlock'
import type { FeatureGridItem } from '@/types/cms'

const items: FeatureGridItem[] = [
  { heading: 'Fast Delivery', description: 'Ship code daily.' },
  { heading: 'Scalable', description: 'Grows with your team.' },
  { heading: 'Secure', description: 'Enterprise-grade security.', iconUrl: '🔒' },
]

describe('FeatureGridBlock', () => {
  it('renders all feature titles', () => {
    render(<FeatureGridBlock _type="featureGridBlock" items={items} />)
    expect(screen.getByText('Fast Delivery')).toBeInTheDocument()
    expect(screen.getByText('Scalable')).toBeInTheDocument()
    expect(screen.getByText('Secure')).toBeInTheDocument()
  })

  it('renders all feature descriptions', () => {
    render(<FeatureGridBlock _type="featureGridBlock" items={items} />)
    expect(screen.getByText('Ship code daily.')).toBeInTheDocument()
    expect(screen.getByText('Grows with your team.')).toBeInTheDocument()
    expect(screen.getByText('Enterprise-grade security.')).toBeInTheDocument()
  })

  it('renders the optional grid heading', () => {
    render(
      <FeatureGridBlock
        _type="featureGridBlock"
        heading="Why Choose Us"
        items={items}
      />
    )
    expect(screen.getByRole('heading', { name: 'Why Choose Us' })).toBeInTheDocument()
  })

  it('does not render a heading when heading prop is omitted', () => {
    render(<FeatureGridBlock _type="featureGridBlock" items={items} />)
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument()
  })

  it('renders an icon when iconUrl is provided', () => {
    render(<FeatureGridBlock _type="featureGridBlock" items={items} />)
    expect(screen.getByText('🔒')).toBeInTheDocument()
  })

  it('wraps content in a data-component="feature-grid-block" element', () => {
    const { container } = render(
      <FeatureGridBlock _type="featureGridBlock" items={items} />
    )
    expect(
      container.querySelector('[data-component="feature-grid-block"]')
    ).toBeInTheDocument()
  })

  it('forwards subtitle to the feature grid', () => {
    render(
      <FeatureGridBlock
        _type="featureGridBlock"
        heading="Why Choose Us"
        subtitle="Everything included"
        items={items}
      />
    )
    expect(screen.getByText('Everything included')).toBeInTheDocument()
  })

  it('forwards variant="list" to the feature grid', () => {
    const { container } = render(
      <FeatureGridBlock _type="featureGridBlock" items={items} variant="list" />
    )
    expect(
      container.querySelector('[data-component="feature-grid"]')
    ).toHaveAttribute('data-variant', 'list')
  })
})
