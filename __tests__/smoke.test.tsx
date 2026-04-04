import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

function Smoke() {
  return <p>ok</p>
}

describe('smoke', () => {
  it('renders a React component', () => {
    render(<Smoke />)
    expect(screen.getByText('ok')).toBeInTheDocument()
  })
})
