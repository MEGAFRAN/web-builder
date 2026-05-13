import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ServicesBlock from '@/components/blocks/ServicesBlock'

describe('ServicesBlock', () => {
  const items = [
    { title: 'Corte de pelo', description: 'Corte clásico o moderno' },
    { title: 'Coloración', description: 'Tintes y mechas' },
  ]

  it('renders section heading when provided', () => {
    render(
      <ServicesBlock _type="services" heading="Our services" items={items} />,
    )
    expect(
      screen.getByRole('heading', { level: 2, name: 'Our services' }),
    ).toBeInTheDocument()
  })

  it('renders all service cards', () => {
    render(<ServicesBlock _type="services" items={items} />)
    expect(screen.getByText('Corte de pelo')).toBeInTheDocument()
    expect(screen.getByText('Coloración')).toBeInTheDocument()
  })

  it('renders descriptions for each service', () => {
    render(<ServicesBlock _type="services" items={items} />)
    expect(screen.getByText('Corte clásico o moderno')).toBeInTheDocument()
    expect(screen.getByText('Tintes y mechas')).toBeInTheDocument()
  })

  it('renders empty state when items array is empty', () => {
    render(<ServicesBlock _type="services" items={[]} />)
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
  })

  it('renders price as free-form string', () => {
    render(
      <ServicesBlock
        _type="services"
        items={[
          {
            title: 'Pack básico',
            description: 'Incluye consulta.',
            price: 'desde 50 euros',
          },
        ]}
      />,
    )
    expect(screen.getByText('desde 50 euros')).toBeInTheDocument()
  })

  it('renders subItems as a stacked bullet list', () => {
    render(
      <ServicesBlock
        _type="services"
        items={[
          {
            title: 'Masajes',
            description: 'Varias modalidades.',
            subItems: ['Descontracturante', 'Relajante'],
          },
        ]}
      />,
    )
    expect(screen.getByRole('list')).toBeInTheDocument()
    expect(screen.getByText('Descontracturante')).toBeInTheDocument()
    expect(screen.getByText('Relajante')).toBeInTheDocument()
  })

  it('renders service image with alt text', () => {
    render(
      <ServicesBlock
        _type="services"
        items={[
          {
            title: 'Spa',
            description: 'Relajación total.',
            imageUrl: 'https://example.com/spa.jpg',
            imageAlt: 'Cabina de spa',
          },
        ]}
      />,
    )
    const img = screen.getByRole('img', { name: 'Cabina de spa' })
    expect(img).toHaveAttribute('src', 'https://example.com/spa.jpg')
  })
})
