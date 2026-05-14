import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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

  it('renders subItems as an accordion with expandable details', () => {
    render(
      <ServicesBlock
        _type="services"
        items={[
          {
            title: 'Masajes',
            description: 'Varias modalidades.',
            subItems: [
              {
                label: 'Descontracturante',
                price: '50 €',
                duration: '50 min',
                description: {
                  title: 'Enfoque en tensiones profundas.',
                  items: ['Trabajo localizado en espalda y cuello', 'Ideal tras esfuerzo físico'],
                },
              },
              {
                label: 'Relajante',
                price: '45 €',
                duration: '45 min',
                description: {
                  title: 'Masaje suave antiestrés.',
                  items: ['Ritmo lento', 'Prioriza calma y descanso'],
                },
              },
            ],
          },
        ]}
      />,
    )

    const firstBtn = screen.getByRole('button', { name: /descontracturante/i })
    expect(screen.queryByText('Enfoque en tensiones profundas.')).not.toBeInTheDocument()

    fireEvent.click(firstBtn)
    expect(screen.getByText('Enfoque en tensiones profundas.')).toBeInTheDocument()
    expect(screen.getByText('Trabajo localizado en espalda y cuello')).toBeInTheDocument()
    expect(screen.getByText('50 €')).toBeInTheDocument()
    expect(screen.getByText('50 min')).toBeInTheDocument()
    expect(firstBtn).toHaveAttribute('aria-expanded', 'true')

    fireEvent.click(firstBtn)
    expect(screen.queryByText('Enfoque en tensiones profundas.')).not.toBeInTheDocument()
    expect(firstBtn).toHaveAttribute('aria-expanded', 'false')
  })

  it('expands subItem with description title only (no items array)', () => {
    render(
      <ServicesBlock
        _type="services"
        items={[
          {
            title: 'Masajes',
            description: 'Varias modalidades.',
            subItems: [
              {
                label: 'Relajante antiestrés',
                price: '45 €',
                duration: '60 min',
                description: {
                  title: 'Solo párrafo introductorio, sin lista.',
                },
              },
            ],
          },
        ]}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /relajante antiestrés/i }))
    expect(screen.getByText('Solo párrafo introductorio, sin lista.')).toBeInTheDocument()
  })

  it('supports legacy string subItems as accordion labels', () => {
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
    expect(
      screen.getByRole('button', { name: /descontracturante/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /relajante/i })).toBeInTheDocument()
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
