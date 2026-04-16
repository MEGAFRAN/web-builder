import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ContactInfoBlock from '@/components/blocks/ContactInfoBlock'

// Prevent real fetch calls originating from ContactFormSection
vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ContactInfoBlock', () => {
  it('renders the "Get in Touch" page header', () => {
    render(<ContactInfoBlock _type="contactInfoBlock" />)
    expect(
      screen.getByRole('heading', { name: /get in touch/i })
    ).toBeInTheDocument()
  })

  it('renders the contact form', () => {
    render(<ContactInfoBlock _type="contactInfoBlock" />)
    // ContactForm labels are not associated via htmlFor — use data-component selector
    const { container } = render(<ContactInfoBlock _type="contactInfoBlock" />)
    expect(container.querySelector('[data-component="contact-form"]')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /send message/i }).length).toBeGreaterThan(0)
  })

  it('renders email when provided', () => {
    render(<ContactInfoBlock _type="contactInfoBlock" email="hello@agency.com" />)
    expect(screen.getByText('hello@agency.com')).toBeInTheDocument()
  })

  it('does not render email section when email is omitted', () => {
    render(<ContactInfoBlock _type="contactInfoBlock" phone="+1 555 0100" />)
    // The Email heading should not be present
    expect(screen.queryByRole('heading', { name: 'Email' })).not.toBeInTheDocument()
  })

  it('renders phone when provided', () => {
    render(<ContactInfoBlock _type="contactInfoBlock" phone="+1 555 0100" />)
    expect(screen.getByText('+1 555 0100')).toBeInTheDocument()
  })

  it('renders address when provided', () => {
    render(
      <ContactInfoBlock _type="contactInfoBlock" address="123 Main St, Springfield" />
    )
    expect(screen.getByText('123 Main St, Springfield')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Office' })).toBeInTheDocument()
  })

  it('renders all three contact details when all are provided', () => {
    render(
      <ContactInfoBlock
        _type="contactInfoBlock"
        email="hi@example.com"
        phone="+34 91 000 00 00"
        address="Calle Mayor 1, Madrid"
      />
    )
    expect(screen.getByText('hi@example.com')).toBeInTheDocument()
    expect(screen.getByText('+34 91 000 00 00')).toBeInTheDocument()
    expect(screen.getByText('Calle Mayor 1, Madrid')).toBeInTheDocument()
  })
})
