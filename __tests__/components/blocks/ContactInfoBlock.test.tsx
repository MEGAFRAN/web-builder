import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ContactInfoBlock from '@/components/blocks/ContactInfoBlock'

vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ContactInfoBlock', () => {
  it('renders the contact form', () => {
    const { container } = render(<ContactInfoBlock _type="contactInfoBlock" />)
    expect(container.querySelector('[data-component="contact-form"]')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /enviar mensaje/i }),
    ).toBeInTheDocument()
  })

  it('renders email when provided', () => {
    render(<ContactInfoBlock _type="contactInfoBlock" email="hello@agency.com" />)
    expect(screen.getByText('hello@agency.com')).toBeInTheDocument()
    expect(screen.getAllByText(/correo electrónico/i).length).toBeGreaterThan(0)
  })

  it('does not render email section when email is omitted', () => {
    render(<ContactInfoBlock _type="contactInfoBlock" phone="+1 555 0100" />)
    expect(screen.queryByRole('link', { name: /.+@.+/ })).not.toBeInTheDocument()
  })

  it('renders phone when provided', () => {
    render(<ContactInfoBlock _type="contactInfoBlock" phone="+1 555 0100" />)
    expect(screen.getByText('+1 555 0100')).toBeInTheDocument()
  })

  it('renders address when provided', () => {
    render(
      <ContactInfoBlock _type="contactInfoBlock" address="123 Main St, Springfield" />,
    )
    expect(screen.getByText('123 Main St, Springfield')).toBeInTheDocument()
    expect(screen.getByText(/dirección/i)).toBeInTheDocument()
  })

  it('renders all three contact details when all are provided', () => {
    render(
      <ContactInfoBlock
        _type="contactInfoBlock"
        email="hi@example.com"
        phone="+34 91 000 00 00"
        address="Calle Mayor 1, Madrid"
      />,
    )
    expect(screen.getByText('hi@example.com')).toBeInTheDocument()
    expect(screen.getByText('+34 91 000 00 00')).toBeInTheDocument()
    expect(screen.getByText('Calle Mayor 1, Madrid')).toBeInTheDocument()
  })
})
