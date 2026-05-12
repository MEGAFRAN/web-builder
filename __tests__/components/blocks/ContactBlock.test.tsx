import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ContactBlock from '@/components/blocks/ContactBlock'

describe('ContactBlock', () => {
  it('renders title when provided', () => {
    render(<ContactBlock _type="contact" title="Contacto" phone="912345678" />)
    expect(screen.getByRole('heading', { level: 2, name: 'Contacto' })).toBeInTheDocument()
  })

  it('does not render a title heading when title is omitted', () => {
    render(<ContactBlock _type="contact" phone="912345678" />)
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument()
  })

  it('renders phone when provided', () => {
    render(<ContactBlock _type="contact" phone="912345678" />)
    expect(screen.getByText('912345678')).toBeInTheDocument()
  })

  it('renders email when provided', () => {
    render(<ContactBlock _type="contact" email="info@pepe.com" />)
    expect(screen.getByText('info@pepe.com')).toBeInTheDocument()
  })

  it('renders address when provided', () => {
    render(<ContactBlock _type="contact" address="Calle Mayor 1, Madrid" />)
    expect(screen.getByText('Calle Mayor 1, Madrid')).toBeInTheDocument()
  })
})
