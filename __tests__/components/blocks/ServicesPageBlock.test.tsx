import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ServicesPageBlock from '@/components/blocks/ServicesPageBlock'
import type { ServiceFeatureCategory, ServiceCardItem } from '@/types/cms'

const featureCategories: ServiceFeatureCategory[] = [
  { title: 'Strategy', summary: 'We help you set direction.', categoryBadge: 'Strategy' },
  { title: 'Development', summary: 'Full-stack engineering.', categoryBadge: 'Dev' },
]

const serviceCards: ServiceCardItem[] = [
  {
    title: 'Web Development',
    description: 'Custom websites built for performance.',
    deliverables: ['Responsive design', 'CMS integration'],
    ctaLabel: 'Learn More',
    ctaHref: '/services/web',
  },
  {
    title: 'SEO',
    description: 'Rank higher and get found.',
    deliverables: ['Keyword research', 'On-page optimisation'],
  },
]

describe('ServicesPageBlock', () => {
  it('renders the default hero heading when heroHeading is not provided', () => {
    render(<ServicesPageBlock _type="servicesPageBlock" />)
    expect(
      screen.getByRole('heading', { name: /our services/i })
    ).toBeInTheDocument()
  })

  it('renders a custom heroHeading when provided', () => {
    render(
      <ServicesPageBlock
        _type="servicesPageBlock"
        heroHeading="What We Do"
      />
    )
    expect(screen.getByRole('heading', { name: 'What We Do' })).toBeInTheDocument()
  })

  it('renders feature category titles in the feature grid', () => {
    render(
      <ServicesPageBlock
        _type="servicesPageBlock"
        featureCategories={featureCategories}
      />
    )
    // Each category title is used as both the icon badge and the feature grid h3 — use getAllByText
    expect(screen.getAllByText('Strategy').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Development').length).toBeGreaterThanOrEqual(1)
  })

  it('renders service card titles', () => {
    render(
      <ServicesPageBlock
        _type="servicesPageBlock"
        serviceCards={serviceCards}
      />
    )
    expect(screen.getByRole('heading', { name: 'Web Development' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'SEO' })).toBeInTheDocument()
  })

  it('renders service card descriptions', () => {
    render(
      <ServicesPageBlock
        _type="servicesPageBlock"
        serviceCards={serviceCards}
      />
    )
    expect(
      screen.getByText('Custom websites built for performance.')
    ).toBeInTheDocument()
    expect(screen.getByText('Rank higher and get found.')).toBeInTheDocument()
  })

  it('renders deliverable items for service cards', () => {
    render(
      <ServicesPageBlock
        _type="servicesPageBlock"
        serviceCards={serviceCards}
      />
    )
    expect(screen.getByText('Responsive design')).toBeInTheDocument()
    expect(screen.getByText('CMS integration')).toBeInTheDocument()
  })

  it('renders service CTA link when ctaLabel is provided', () => {
    render(
      <ServicesPageBlock
        _type="servicesPageBlock"
        serviceCards={serviceCards}
      />
    )
    expect(
      screen.getByRole('link', { name: 'Learn More' })
    ).toHaveAttribute('href', '/services/web')
  })

  it('renders default FAQ items when faqItems is not provided', () => {
    render(<ServicesPageBlock _type="servicesPageBlock" />)
    expect(
      screen.getByText('How long does a typical project take?')
    ).toBeInTheDocument()
  })

  it('renders custom FAQ items when provided', () => {
    render(
      <ServicesPageBlock
        _type="servicesPageBlock"
        faqItems={[{ question: 'Do you offer retainers?', answer: 'Yes, we do.' }]}
      />
    )
    expect(screen.getByText('Do you offer retainers?')).toBeInTheDocument()
  })

  it('renders the breadcrumb with Home and Services', () => {
    render(<ServicesPageBlock _type="servicesPageBlock" />)
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
    expect(screen.getByText('Services')).toBeInTheDocument()
  })

  it('renders the bottom CTA link to /contact', () => {
    render(<ServicesPageBlock _type="servicesPageBlock" />)
    expect(
      screen.getByRole('link', { name: 'Book a Free Consultation' })
    ).toHaveAttribute('href', '/contact')
  })
})
