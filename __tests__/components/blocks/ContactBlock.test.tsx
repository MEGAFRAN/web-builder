import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ContactBlock from '@/components/blocks/ContactBlock'

const SAMPLE_EMBED =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1!2d0!3d0!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1'

describe('ContactBlock', () => {
  it('renders title when provided', () => {
    render(
      <ContactBlock _type="contact" showMap={false} title="Contacto" phone="912345678" />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Contacto' })).toBeInTheDocument()
  })

  it('does not render a title heading when title is omitted', () => {
    render(<ContactBlock _type="contact" showMap={false} phone="912345678" />)
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument()
  })

  it('renders phone when provided', () => {
    render(<ContactBlock _type="contact" showMap={false} phone="912345678" />)
    expect(screen.getByText('912345678')).toBeInTheDocument()
  })

  it('renders email when provided', () => {
    render(<ContactBlock _type="contact" showMap={false} email="info@pepe.com" />)
    expect(screen.getByText('info@pepe.com')).toBeInTheDocument()
  })

  it('renders address when provided', () => {
    render(<ContactBlock _type="contact" showMap={false} address="Calle Mayor 1, Madrid" />)
    expect(screen.getByText('Calle Mayor 1, Madrid')).toBeInTheDocument()
  })

  it('renders map iframe when showMap is true and mapEmbedSrc is set', () => {
    render(<ContactBlock _type="contact" showMap={true} mapEmbedSrc={SAMPLE_EMBED} />)
    const iframe = screen.getByTestId('contact-map-iframe')
    expect(iframe).toBeInTheDocument()
    expect(iframe).toHaveAttribute('src', SAMPLE_EMBED)
  })

  it('does not render map when showMap is false', () => {
    render(<ContactBlock _type="contact" showMap={false} mapEmbedSrc={SAMPLE_EMBED} />)
    expect(screen.queryByTestId('contact-map-iframe')).not.toBeInTheDocument()
  })

  it('does not render map when showMap is true but mapEmbedSrc is missing', () => {
    render(<ContactBlock _type="contact" showMap={true} />)
    expect(screen.queryByTestId('contact-map-iframe')).not.toBeInTheDocument()
  })
})
