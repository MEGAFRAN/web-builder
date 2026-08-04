import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ProductExampleBlock from '@/components/blocks/ProductExampleBlock'

describe('ProductExampleBlock', () => {
  it('renders the heading as an h2', () => {
    render(
      <ProductExampleBlock
        _type="productExampleBlock"
        heading="Así se ve una web Clubtal"
        imageUrl="/clients/clubtal/clubtal-mobile.webp"
      />,
    )
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Así se ve una web Clubtal',
      }),
    ).toBeInTheDocument()
  })

  it('renders the image with provided alt text', () => {
    render(
      <ProductExampleBlock
        _type="productExampleBlock"
        heading="Example"
        imageUrl="/clients/clubtal/clubtal-mobile.webp"
        imageAlt="Phone mockup"
      />,
    )
    expect(screen.getByRole('img', { name: 'Phone mockup' })).toBeInTheDocument()
  })

  it('falls back to heading as image alt when imageAlt is omitted', () => {
    render(
      <ProductExampleBlock
        _type="productExampleBlock"
        heading="Example heading"
        imageUrl="/clients/clubtal/clubtal-mobile.webp"
      />,
    )
    expect(
      screen.getByRole('img', { name: 'Example heading' }),
    ).toBeInTheDocument()
  })

  it('wraps the image in a link when href is provided', () => {
    render(
      <ProductExampleBlock
        _type="productExampleBlock"
        heading="Example"
        imageUrl="/clients/clubtal/clubtal-mobile.webp"
        imageAlt="Phone mockup"
        href="https://moviles.clubtal.com"
      />,
    )
    const image = screen.getByRole('img', { name: 'Phone mockup' })
    expect(image.closest('a')).toHaveAttribute(
      'href',
      'https://moviles.clubtal.com',
    )
  })

  it('does not wrap the image in a link when href is omitted', () => {
    render(
      <ProductExampleBlock
        _type="productExampleBlock"
        heading="Example"
        imageUrl="/clients/clubtal/clubtal-mobile.webp"
        imageAlt="Phone mockup"
      />,
    )
    const image = screen.getByRole('img', { name: 'Phone mockup' })
    expect(image.closest('a')).toBeNull()
  })

  it('wraps content in a data-component="product-example-block" element', () => {
    const { container } = render(
      <ProductExampleBlock
        _type="productExampleBlock"
        heading="Example"
        imageUrl="/clients/clubtal/clubtal-mobile.webp"
      />,
    )
    expect(
      container.querySelector('[data-component="product-example-block"]'),
    ).toBeInTheDocument()
  })
})
