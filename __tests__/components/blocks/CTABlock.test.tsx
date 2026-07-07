import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import CTABlock from '@/components/blocks/CTABlock'

describe('CTABlock', () => {
  it('renders the headline', () => {
    render(
      <CTABlock
        _type="ctaBlock"
        headline="Ready to get started?"
        ctaLabel="Contact Us"
      />
    )
    expect(screen.getByRole('heading', { name: 'Ready to get started?' })).toBeInTheDocument()
  })

  it('renders the CTA button label', () => {
    render(
      <CTABlock _type="ctaBlock" headline="Go" ctaLabel="Sign Up Now" />
    )
    expect(screen.getByRole('button', { name: 'Sign Up Now' })).toBeInTheDocument()
  })

  it('renders a link when ctaHref is provided', () => {
    render(
      <CTABlock
        _type="ctaBlock"
        headline="Go"
        ctaLabel="Email me"
        ctaHref="mailto:hello@example.com"
      />
    )
    expect(screen.getByRole('link', { name: 'Email me' })).toHaveAttribute(
      'href',
      'mailto:hello@example.com'
    )
  })

  it('renders subtext when provided', () => {
    render(
      <CTABlock
        _type="ctaBlock"
        headline="Let's Talk"
        subtext="No commitment required"
        ctaLabel="Book a Call"
      />
    )
    expect(screen.getByText('No commitment required')).toBeInTheDocument()
  })

  it('does not render subtext element when subtext is omitted', () => {
    const { container } = render(
      <CTABlock _type="ctaBlock" headline="Let's Talk" ctaLabel="Book a Call" />
    )
    // The Hero/CTA section only renders subtext paragraph when provided
    const paragraphs = container.querySelectorAll('p')
    paragraphs.forEach((p) => {
      expect(p.textContent).not.toBe('')
    })
  })

  it('wraps content in a data-component="cta-block" element', () => {
    const { container } = render(
      <CTABlock _type="ctaBlock" headline="Hello" ctaLabel="Go" />
    )
    expect(container.querySelector('[data-component="cta-block"]')).toBeInTheDocument()
  })
})
