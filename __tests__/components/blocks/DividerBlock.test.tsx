import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import DividerBlock from '@/components/blocks/DividerBlock'

describe('DividerBlock', () => {
  it('renders the divider wrapper element', () => {
    const { container } = render(<DividerBlock _type="divider" />)
    expect(
      container.querySelector('[data-component="divider-block"]')
    ).toBeInTheDocument()
  })

  it('renders an hr element as the visual separator', () => {
    const { container } = render(<DividerBlock _type="divider" />)
    expect(container.querySelector('hr')).toBeInTheDocument()
  })
})
