import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ContactBlock from '@/components/blocks/ContactBlock'

describe('ContactBlock', () => {
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

  it('renders map placeholder when showMap is true', () => {
    render(<ContactBlock _type="contact" showMap={true} />)
    expect(screen.getByTestId('map-placeholder')).toBeInTheDocument()
  })

  it('does not render map when showMap is false', () => {
    render(<ContactBlock _type="contact" showMap={false} />)
    expect(screen.queryByTestId('map-placeholder')).not.toBeInTheDocument()
  })
})
