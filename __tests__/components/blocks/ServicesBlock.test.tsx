import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
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

  it('opens a modal with subItem details when showModal is true', () => {
    render(
      <ServicesBlock
        _type="services"
        showModal
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
                  items: ['Trabajo localizado en espalda y cuello'],
                },
              },
            ],
          },
        ]}
      />,
    )

    expect(screen.getByText('50 €')).toBeInTheDocument()
    expect(screen.getByText('50 min')).toBeInTheDocument()

    const detailsBtn = screen.getByRole('button', { name: /más información sobre descontracturante/i })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    fireEvent.click(detailsBtn)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(screen.getByText('Enfoque en tensiones profundas.')).toBeInTheDocument()
    expect(screen.getByText('Trabajo localizado en espalda y cuello')).toBeInTheDocument()
    expect(detailsBtn).not.toHaveAttribute('aria-expanded')
  })

  it('renders subItem imageUrl inside the modal body above details', () => {
    render(
      <ServicesBlock
        _type="services"
        showModal
        items={[
          {
            title: 'Masajes',
            description: 'Varias modalidades.',
            subItems: [
              {
                label: 'Descontracturante',
                pricingRows: [{ duration: '50 min', price: '50 €' }],
                imageUrl: 'https://example.com/sub-item.jpg',
                imageAlt: 'Vista del masaje',
                description: {
                  title: 'Enfoque en tensiones profundas.',
                  items: [],
                },
              },
            ],
          },
        ]}
      />,
    )

    fireEvent.click(
      screen.getByRole('button', { name: /más información sobre descontracturante/i }),
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(
      within(screen.getByRole('dialog')).getByRole('img', { name: 'Vista del masaje' }),
    ).toHaveAttribute('src', 'https://example.com/sub-item.jpg')
    expect(screen.getByText('Enfoque en tensiones profundas.')).toBeInTheDocument()
  })

  it('shows "Más información" cta below label when item has description', () => {
    render(
      <ServicesBlock
        _type="services"
        showModal
        items={[
          {
            title: 'Masajes',
            description: 'Varias modalidades.',
            subItems: [
              {
                label: 'Relajante',
                price: '45 €',
                duration: '45 min',
                description: { title: 'Masaje suave.' },
              },
              { label: 'Sin detalles', price: '30 €' },
            ],
          },
        ]}
      />,
    )

    expect(screen.getByRole('button', { name: /más información sobre relajante/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /más información sobre sin detalles/i })).not.toBeInTheDocument()
  })

  it('uses moreInfoLabel prop as the cta text instead of the default', () => {
    render(
      <ServicesBlock
        _type="services"
        showModal
        moreInfoLabel="Ver detalles"
        items={[
          {
            title: 'Masajes',
            description: 'Varias modalidades.',
            subItems: [
              {
                label: 'Relajante',
                description: { title: 'Masaje suave.' },
              },
            ],
          },
        ]}
      />,
    )

    expect(screen.getByRole('button', { name: /ver detalles sobre relajante/i })).toBeInTheDocument()
    expect(screen.queryByText('Más información')).not.toBeInTheDocument()
  })

  it('stacks duration, price and Reservar below the label and more-info CTA in modal list', () => {
    render(
      <ServicesBlock
        _type="services"
        showModal
        items={[
          {
            title: 'Masajes',
            description: 'Varias modalidades.',
            subItems: [
              { label: 'Relajante', price: '45 €', duration: '45 min' },
              { label: 'Deportivo', price: '55 €' },
              { label: 'Básico', duration: '30 min' },
              { label: 'Simple' },
            ],
          },
        ]}
      />,
    )

    expect(screen.getByText('45 €')).toBeInTheDocument()
    expect(screen.getByText('45 min')).toBeInTheDocument()
    expect(screen.getByText('55 €')).toBeInTheDocument()
    expect(screen.getByText('30 min')).toBeInTheDocument()
  })

  it('renders multiple stacked pricing rows when pricingRows is set', () => {
    render(
      <ServicesBlock
        _type="services"
        showModal
        bookingUrl="https://booksy.com/fallback"
        items={[
          {
            title: 'Tratamientos',
            description: 'Opciones.',
            subItems: [
              {
                label: 'Ondas de choque',
                pricingRows: [
                  { duration: '90 min', price: '75 €' },
                  { duration: '30 min', price: '50 €' },
                ],
                description: { title: 'Detalle del tratamiento.' },
              },
            ],
          },
        ]}
      />,
    )

    expect(screen.getByText('90 min')).toBeInTheDocument()
    expect(screen.getByText('75 €')).toBeInTheDocument()
    expect(screen.getByText('30 min')).toBeInTheDocument()
    expect(screen.getByText('50 €')).toBeInTheDocument()
    const links = screen.getAllByRole('link', { name: 'Reservar' })
    expect(links).toHaveLength(2)
    links.forEach((link) =>
      expect(link).toHaveAttribute('href', 'https://booksy.com/fallback'),
    )
  })

  it('uses services block bookingUrl for a pricing row when row omits bookingUrl', () => {
    render(
      <ServicesBlock
        _type="services"
        showModal
        bookingUrl="https://booksy.com/default"
        items={[
          {
            title: 'Tratamientos',
            description: 'Opciones.',
            subItems: [
              {
                label: 'Dos opciones',
                pricingRows: [
                  {
                    duration: '60 min',
                    price: '60 €',
                    bookingUrl: 'https://booksy.com/tier-a',
                  },
                  { duration: '30 min', price: '35 €' },
                ],
              },
            ],
          },
        ]}
      />,
    )

    const links = screen.getAllByRole('link', { name: 'Reservar' })
    expect(links).toHaveLength(2)
    expect(links[0]).toHaveAttribute('href', 'https://booksy.com/tier-a')
    expect(links[1]).toHaveAttribute('href', 'https://booksy.com/default')
  })

  it('renders a Reservar link when bookingUrl is provided', () => {
    render(
      <ServicesBlock
        _type="services"
        showModal
        items={[
          {
            title: 'Sesiones',
            description: 'Reserva online.',
            subItems: [
              {
                label: 'Sesión Corporal',
                price: '80,00 €',
                duration: '30min',
                bookingUrl: 'https://example.com/reservar',
              },
            ],
          },
        ]}
      />,
    )

    const link = screen.getByRole('link', { name: 'Reservar' })
    expect(link).toHaveAttribute('href', 'https://example.com/reservar')
    expect(link).toHaveAttribute('target', '_blank')
    expect(screen.getByText('80,00 €')).toBeInTheDocument()
    expect(screen.getByText('30min')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /ver detalles/i })).not.toBeInTheDocument()
  })

  it('does not render Reservar link when bookingUrl is absent', () => {
    render(
      <ServicesBlock
        _type="services"
        showModal
        items={[
          {
            title: 'Sesiones',
            description: 'Descripción.',
            subItems: [{ label: 'Sesión Corporal', price: '80 €' }],
          },
        ]}
      />,
    )

    expect(screen.queryByRole('link', { name: 'Reservar' })).not.toBeInTheDocument()
  })

  it('uses block-level bookingUrl as fallback for all sub-item rows', () => {
    render(
      <ServicesBlock
        _type="services"
        showModal
        bookingUrl="https://booksy.com/test"
        items={[
          {
            title: 'Sesiones',
            description: 'Descripción.',
            subItems: [
              { label: 'Sesión A', price: '80 €', duration: '30min' },
              { label: 'Sesión B', price: '100 €', duration: '50min' },
            ],
          },
        ]}
      />,
    )

    const links = screen.getAllByRole('link', { name: 'Reservar' })
    expect(links).toHaveLength(2)
    links.forEach((link) => expect(link).toHaveAttribute('href', 'https://booksy.com/test'))
  })

  it('item-level bookingUrl takes priority over block-level bookingUrl', () => {
    render(
      <ServicesBlock
        _type="services"
        showModal
        bookingUrl="https://booksy.com/fallback"
        items={[
          {
            title: 'Sesiones',
            description: 'Descripción.',
            subItems: [
              {
                label: 'Sesión A',
                price: '80 €',
                bookingUrl: 'https://booksy.com/item-specific',
              },
            ],
          },
        ]}
      />,
    )

    const link = screen.getByRole('link', { name: 'Reservar' })
    expect(link).toHaveAttribute('href', 'https://booksy.com/item-specific')
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
