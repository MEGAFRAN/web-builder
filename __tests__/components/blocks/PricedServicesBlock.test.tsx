import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import PricedServicesBlock from '@/components/blocks/PricedServicesBlock'
import type { PricedServiceCardItem } from '@/types/cms'

const serviceCards: PricedServiceCardItem[] = [
  {
    title: 'Cambio de pantalla',
    description: 'Sustitución de pantalla rota o con fallos táctiles.',
    price: 'Desde 39€',
    ctaLabel: 'Pedir presupuesto',
    ctaHref: 'https://wa.me/34915550198',
  },
  {
    title: 'Cambio de batería',
    description: 'Batería nueva con garantía.',
    price: 'Desde 29€',
  },
]

describe('PricedServicesBlock', () => {
  it('renders heading and subtext when provided', () => {
    render(
      <PricedServicesBlock
        _type="pricedServicesBlock"
        heading="Servicios de reparación"
        subtext="Precios orientativos para las reparaciones más habituales."
      />
    )
    expect(
      screen.getByRole('heading', { name: 'Servicios de reparación' })
    ).toBeInTheDocument()
    expect(
      screen.getByText('Precios orientativos para las reparaciones más habituales.')
    ).toBeInTheDocument()
  })

  it('renders service cards with prominent price text and CTAs', () => {
    render(
      <PricedServicesBlock
        _type="pricedServicesBlock"
        serviceCards={serviceCards}
      />
    )
    expect(screen.getByRole('heading', { name: 'Cambio de pantalla' })).toBeInTheDocument()
    expect(screen.getByText('Desde 39€')).toBeInTheDocument()
    expect(screen.queryByText('Precio:')).not.toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Pedir presupuesto' })
    ).toHaveAttribute('href', 'https://wa.me/34915550198')
  })

  it('falls back to deliverables when price is missing', () => {
    render(
      <PricedServicesBlock
        _type="pricedServicesBlock"
        serviceCards={[
          {
            title: 'Cambio de pantalla',
            description: 'Sustitución de pantalla rota o con fallos táctiles.',
            deliverables: ['Desde 39€'],
          },
        ]}
      />
    )
    expect(screen.getByText('Desde 39€')).toBeInTheDocument()
  })

  it('renders view-all link when label and href are provided', () => {
    render(
      <PricedServicesBlock
        _type="pricedServicesBlock"
        viewAllLabel="Ver todos los servicios y precios →"
        viewAllHref="/servicios"
      />
    )
    expect(
      screen.getByRole('link', { name: 'Ver todos los servicios y precios →' })
    ).toHaveAttribute('href', '/servicios')
  })

  it('does not render breadcrumb or FAQ content', () => {
    render(
      <PricedServicesBlock
        _type="pricedServicesBlock"
        heading="Servicios"
        serviceCards={serviceCards}
      />
    )
    expect(screen.queryByText('Inicio')).not.toBeInTheDocument()
    expect(screen.queryByText('Preguntas frecuentes')).not.toBeInTheDocument()
  })
})
