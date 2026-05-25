import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, within, act, waitFor } from '@testing-library/react'
import ServicesBlock from '@/components/blocks/ServicesBlock'

function jsonResponse(data: unknown): Response {
  return {
    ok: true,
    json: async () => data,
  } as Response
}

describe('ServicesBlock', () => {
  const items = [
    { title: 'Corte de pelo', description: 'Corte clásico o moderno' },
    { title: 'Coloración', description: 'Tintes y mechas' },
  ]

  let fetchSpy: ReturnType<typeof vi.spyOn>

  async function flushServicesBlockCatalog() {
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalled()
    })
    await act(async () => {
      const pendingFetch = fetchSpy.mock.results.at(-1)?.value
      if (pendingFetch instanceof Promise) {
        await pendingFetch
      }
      await new Promise<void>(resolve => setTimeout(resolve, 0))
    })
  }

  async function renderServicesBlock(ui: Parameters<typeof render>[0]) {
    const utils = render(ui)
    await flushServicesBlockCatalog()
    return utils
  }

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((input) => {
      const url = typeof input === 'string' ? input : input instanceof Request ? input.url : input.href
      if (url.includes('/api/booking-services')) {
        return Promise.resolve(jsonResponse({ services: [] }))
      }
      return Promise.reject(new Error(`Unexpected fetch: ${url}`))
    })
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  it('renders section heading when provided', async () => {
    await renderServicesBlock(
      <ServicesBlock _type="services" heading="Our services" items={items} />,
    )
    expect(
      screen.getByRole('heading', { level: 2, name: 'Our services' }),
    ).toBeInTheDocument()
  })

  it('renders all service cards', async () => {
    await renderServicesBlock(<ServicesBlock _type="services" items={items} />)
    expect(screen.getByText('Corte de pelo')).toBeInTheDocument()
    expect(screen.getByText('Coloración')).toBeInTheDocument()
  })

  it('renders descriptions for each service', async () => {
    await renderServicesBlock(<ServicesBlock _type="services" items={items} />)
    expect(screen.getByText('Corte clásico o moderno')).toBeInTheDocument()
    expect(screen.getByText('Tintes y mechas')).toBeInTheDocument()
  })

  it('renders empty state when items array is empty', async () => {
    await renderServicesBlock(<ServicesBlock _type="services" items={[]} />)
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
  })

  it('renders price as free-form string', async () => {
    await renderServicesBlock(
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

  it('renders subItems as an accordion with expandable details', async () => {
    await renderServicesBlock(
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

  it('opens a modal with subItem details when showModal is true', async () => {
    await renderServicesBlock(
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

  it('renders subItem imageUrl inside the modal body above details', async () => {
    await renderServicesBlock(
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

  it('shows "Más información" cta below label when item has description', async () => {
    await renderServicesBlock(
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

  it('uses moreInfoLabel prop as the cta text instead of the default', async () => {
    await renderServicesBlock(
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

  it('stacks duration, price and Reservar below the label and more-info CTA in modal list', async () => {
    await renderServicesBlock(
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

  it('renders multiple stacked pricing rows when pricingRows is set', async () => {
    await renderServicesBlock(
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

  it('uses services block bookingUrl for a pricing row when row omits bookingUrl', async () => {
    await renderServicesBlock(
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

  it('renders a Reservar link when bookingUrl is provided', async () => {
    await renderServicesBlock(
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

  it('does not render Reservar link when bookingUrl is absent', async () => {
    await renderServicesBlock(
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

  it('uses block-level bookingUrl as fallback for all sub-item rows', async () => {
    await renderServicesBlock(
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

  it('item-level bookingUrl takes priority over block-level bookingUrl', async () => {
    await renderServicesBlock(
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

  it('expands subItem with description title only (no items array)', async () => {
    await renderServicesBlock(
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

  it('supports legacy string subItems as accordion labels', async () => {
    await renderServicesBlock(
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

  it('renders service image with alt text', async () => {
    await renderServicesBlock(
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

  it('prefers live admin catalog over CMS items when catalog is non-empty', async () => {
    fetchSpy.mockImplementation((input: Parameters<typeof fetch>[0]) => {
      const url = typeof input === 'string' ? input : input instanceof Request ? input.url : input.href
      if (url.includes('/api/booking-services')) {
        return Promise.resolve(
          jsonResponse({
            services: [
              {
                id: 'svc-1',
                name: 'blower',
                description: 'Professional blow dry',
                durationMinutes: 60,
                price: 100,
                currency: '€',
              },
            ],
          }),
        )
      }
      return Promise.reject(new Error(`Unexpected fetch: ${url}`))
    })

    await renderServicesBlock(
      <ServicesBlock
        _type="services"
        heading="Services"
        items={items}
      />,
    )

    await waitFor(() => {
      expect(screen.getByText('blower')).toBeInTheDocument()
    })
    expect(screen.getByText('Professional blow dry')).toBeInTheDocument()
    expect(screen.getByText('60 min · €100')).toBeInTheDocument()
    expect(screen.queryByText('Corte de pelo')).not.toBeInTheDocument()
  })

  it('falls back to CMS items when admin catalog is empty', async () => {
    await renderServicesBlock(
      <ServicesBlock _type="services" items={items} />,
    )

    await waitFor(() => {
      expect(screen.getByText('Corte de pelo')).toBeInTheDocument()
    })
    expect(screen.getByText('Coloración')).toBeInTheDocument()
  })

  it('renders a book CTA for each catalog-backed service', async () => {
    fetchSpy.mockImplementation((input: Parameters<typeof fetch>[0]) => {
      const url = typeof input === 'string' ? input : input instanceof Request ? input.url : input.href
      if (url.includes('/api/booking-services')) {
        return Promise.resolve(
          jsonResponse({
            services: [
              {
                id: 'svc-1',
                name: 'blower',
                description: '',
                durationMinutes: 60,
                price: 100,
                currency: '€',
              },
            ],
          }),
        )
      }
      return Promise.reject(new Error(`Unexpected fetch: ${url}`))
    })

    await renderServicesBlock(<ServicesBlock _type="services" heading="Services" />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Reservar' })).toBeInTheDocument()
    })
  })

  it('opens reservation modal with preselected service when book CTA is clicked', async () => {
    fetchSpy.mockImplementation((input: Parameters<typeof fetch>[0]) => {
      const url = typeof input === 'string' ? input : input instanceof Request ? input.url : input.href
      if (url.includes('/api/booking-services')) {
        return Promise.resolve(
          jsonResponse({
            services: [
              {
                id: 'svc-1',
                name: 'blower',
                description: '',
                durationMinutes: 60,
                price: 100,
                currency: '€',
              },
            ],
          }),
        )
      }
      return Promise.reject(new Error(`Unexpected fetch: ${url}`))
    })

    await renderServicesBlock(<ServicesBlock _type="services" heading="Services" clientId="hair-salon" />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Reservar' })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Reservar' }))

    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()

    await waitFor(() => {
      expect(document.getElementById('res-date')).toBeInTheDocument()
    })

    expect(within(dialog).getByRole('heading', { name: 'blower' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /blower, 60 minutes/i })).not.toBeInTheDocument()
  })

  it('uses custom bookCtaLabel when provided', async () => {
    fetchSpy.mockImplementation((input: Parameters<typeof fetch>[0]) => {
      const url = typeof input === 'string' ? input : input instanceof Request ? input.url : input.href
      if (url.includes('/api/booking-services')) {
        return Promise.resolve(
          jsonResponse({
            services: [
              {
                id: 'svc-1',
                name: 'blower',
                description: '',
                durationMinutes: 60,
                price: 100,
                currency: '€',
              },
            ],
          }),
        )
      }
      return Promise.reject(new Error(`Unexpected fetch: ${url}`))
    })

    await renderServicesBlock(
      <ServicesBlock _type="services" bookCtaLabel="Book now" />,
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Book now' })).toBeInTheDocument()
    })
  })

  it('shows "Más información" below the price row for catalog-backed services', async () => {
    fetchSpy.mockImplementation((input: Parameters<typeof fetch>[0]) => {
      const url = typeof input === 'string' ? input : input instanceof Request ? input.url : input.href
      if (url.includes('/api/booking-services')) {
        return Promise.resolve(
          jsonResponse({
            services: [
              {
                id: 'svc-1',
                name: 'blower',
                description: 'el mejor blower del pais',
                durationMinutes: 60,
                price: 100,
                currency: '€',
              },
            ],
          }),
        )
      }
      return Promise.reject(new Error(`Unexpected fetch: ${url}`))
    })

    await renderServicesBlock(<ServicesBlock _type="services" heading="Services" clientId="hair-salon" />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /más información sobre blower/i })).toBeInTheDocument()
    })

    const priceRow = screen.getByText('60 min · €100').closest('div')
    const moreInfoButton = screen.getByRole('button', { name: /más información sobre blower/i })
    expect(priceRow).not.toBeNull()
    expect(
      priceRow!.compareDocumentPosition(moreInfoButton) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it('opens an info modal with service details and a booking CTA', async () => {
    fetchSpy.mockImplementation((input: Parameters<typeof fetch>[0]) => {
      const url = typeof input === 'string' ? input : input instanceof Request ? input.url : input.href
      if (url.includes('/api/booking-services')) {
        return Promise.resolve(
          jsonResponse({
            services: [
              {
                id: 'svc-1',
                name: 'blower',
                description: 'el mejor blower del pais',
                durationMinutes: 60,
                price: 100,
                currency: '€',
              },
            ],
          }),
        )
      }
      return Promise.reject(new Error(`Unexpected fetch: ${url}`))
    })

    await renderServicesBlock(<ServicesBlock _type="services" heading="Services" clientId="hair-salon" />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /más información sobre blower/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /más información sobre blower/i }))

    const infoDialog = screen.getByRole('dialog')
    expect(within(infoDialog).getByRole('heading', { name: 'blower' })).toBeInTheDocument()
    expect(within(infoDialog).getByText('el mejor blower del pais')).toBeInTheDocument()
    expect(within(infoDialog).getByText('60 min · €100')).toBeInTheDocument()
    expect(within(infoDialog).getAllByRole('button', { name: 'Reservar' })).toHaveLength(1)
  })

  it('opens the booking modal when Reservar is clicked inside the info modal', async () => {
    fetchSpy.mockImplementation((input: Parameters<typeof fetch>[0]) => {
      const url = typeof input === 'string' ? input : input instanceof Request ? input.url : input.href
      if (url.includes('/api/booking-services')) {
        return Promise.resolve(
          jsonResponse({
            services: [
              {
                id: 'svc-1',
                name: 'blower',
                description: 'el mejor blower del pais',
                durationMinutes: 60,
                price: 100,
                currency: '€',
              },
            ],
          }),
        )
      }
      return Promise.reject(new Error(`Unexpected fetch: ${url}`))
    })

    await renderServicesBlock(<ServicesBlock _type="services" heading="Services" clientId="hair-salon" />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /más información sobre blower/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /más información sobre blower/i }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Reservar' }))

    await waitFor(() => {
      expect(document.getElementById('res-date')).toBeInTheDocument()
    })

    const bookingDialog = screen.getByRole('dialog')
    expect(bookingDialog).toBeInTheDocument()
    expect(within(bookingDialog).getByRole('heading', { name: 'blower' })).toBeInTheDocument()
  })

  it('opens the info modal when the service card body is clicked', async () => {
    fetchSpy.mockImplementation((input: Parameters<typeof fetch>[0]) => {
      const url = typeof input === 'string' ? input : input instanceof Request ? input.url : input.href
      if (url.includes('/api/booking-services')) {
        return Promise.resolve(
          jsonResponse({
            services: [
              {
                id: 'svc-1',
                name: 'blower',
                description: 'el mejor blower del pais',
                durationMinutes: 60,
                price: 100,
                currency: '€',
              },
            ],
          }),
        )
      }
      return Promise.reject(new Error(`Unexpected fetch: ${url}`))
    })

    await renderServicesBlock(<ServicesBlock _type="services" heading="Services" clientId="hair-salon" />)

    await waitFor(() => {
      expect(screen.getByText('el mejor blower del pais')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('el mejor blower del pais'))

    const infoDialog = screen.getByRole('dialog')
    expect(within(infoDialog).getByRole('heading', { name: 'blower' })).toBeInTheDocument()
    expect(within(infoDialog).getByText('el mejor blower del pais')).toBeInTheDocument()
  })

  it('opens the booking modal directly when the card Reservar button is clicked', async () => {
    fetchSpy.mockImplementation((input: Parameters<typeof fetch>[0]) => {
      const url = typeof input === 'string' ? input : input instanceof Request ? input.url : input.href
      if (url.includes('/api/booking-services')) {
        return Promise.resolve(
          jsonResponse({
            services: [
              {
                id: 'svc-1',
                name: 'blower',
                description: 'el mejor blower del pais',
                durationMinutes: 60,
                price: 100,
                currency: '€',
              },
            ],
          }),
        )
      }
      return Promise.reject(new Error(`Unexpected fetch: ${url}`))
    })

    await renderServicesBlock(<ServicesBlock _type="services" heading="Services" clientId="hair-salon" />)

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Reservar' }).length).toBeGreaterThan(0)
    })

    fireEvent.click(screen.getAllByRole('button', { name: 'Reservar' })[0])

    await waitFor(() => {
      expect(document.getElementById('res-date')).toBeInTheDocument()
    })
  })

  it('groups catalog-backed services under category headings', async () => {
    fetchSpy.mockImplementation((input: Parameters<typeof fetch>[0]) => {
      const url = typeof input === 'string' ? input : input instanceof Request ? input.url : input.href
      if (url.includes('/api/booking-services')) {
        return Promise.resolve(
          jsonResponse({
            services: [
              {
                id: 'svc-1',
                name: 'Haircut',
                description: 'Classic cut',
                durationMinutes: 45,
                price: 35,
                currency: '€',
                category: 'Cortes',
              },
              {
                id: 'svc-2',
                name: 'Balayage',
                description: 'Hand-painted color',
                durationMinutes: 120,
                price: 120,
                currency: '€',
                category: 'Coloración',
              },
              {
                id: 'svc-3',
                name: 'Blow dry',
                description: 'Volume finish',
                durationMinutes: 30,
                price: 25,
                currency: '€',
                category: 'Cortes',
              },
            ],
          }),
        )
      }
      return Promise.reject(new Error(`Unexpected fetch: ${url}`))
    })

    await renderServicesBlock(<ServicesBlock _type="services" heading="Services" />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 3, name: 'Cortes' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 3, name: 'Coloración' })).toBeInTheDocument()
    })

    expect(screen.getByRole('heading', { level: 3, name: 'Haircut' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Blow dry' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Balayage' })).toBeInTheDocument()
  })

  it('renders CMS items without category headings when no categories are set', async () => {
    await renderServicesBlock(
      <ServicesBlock
        _type="services"
        items={[
          { title: 'Cut', description: 'Basic cut' },
          { title: 'Color', description: 'Full color' },
        ]}
      />,
    )

    expect(screen.getByRole('heading', { level: 3, name: 'Cut' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Color' })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(2)
  })

  it('stacks catalog service variations on the card instead of a single summary price', async () => {
    fetchSpy.mockImplementation((input: Parameters<typeof fetch>[0]) => {
      const url = typeof input === 'string' ? input : input instanceof Request ? input.url : input.href
      if (url.includes('/api/booking-services')) {
        return Promise.resolve(
          jsonResponse({
            services: [
              {
                id: 'svc-massage',
                name: 'Swedish Massage',
                description: 'Relaxing massage for every body.',
                currency: '€',
                variations: [
                  { id: 'var-30', durationMinutes: 30, price: 40 },
                  { id: 'var-60', label: 'Standard', durationMinutes: 60, price: 60 },
                ],
              },
            ],
          }),
        )
      }
      return Promise.reject(new Error(`Unexpected fetch: ${url}`))
    })

    await renderServicesBlock(<ServicesBlock _type="services" heading="Services" clientId="hair-salon" />)

    await waitFor(() => {
      expect(screen.getByText('30 min')).toBeInTheDocument()
      expect(screen.getByText('Standard')).toBeInTheDocument()
      expect(screen.getByText('60 min')).toBeInTheDocument()
      expect(screen.getByText('€40')).toBeInTheDocument()
      expect(screen.getByText('€60')).toBeInTheDocument()
    })

    expect(screen.queryByText('Desde €40 · 30-60 min')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reservar' })).toBeInTheDocument()
  })
})
