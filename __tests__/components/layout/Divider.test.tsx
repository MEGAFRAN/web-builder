import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Divider } from '@/components/layout/Divider'

// ─── Helper ───────────────────────────────────────────────────────────────────

function renderDivider() {
  const { container } = render(<Divider />)
  return container
}

function getHr(container: HTMLElement) {
  return container.querySelector('hr[data-component="divider"]') as HTMLHRElement
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Divider', () => {
  describe('root element', () => {
    it('renders an <hr> with data-component="divider"', () => {
      const container = renderDivider()
      expect(getHr(container)).not.toBeNull()
    })
  })

  describe('classes — always present', () => {
    it.each([
      ['border-border', 'border-border'],
      ['my-8',          'my-8'],
    ])('has class %s', (_cls, expectedClass) => {
      const container = renderDivider()
      expect(getHr(container).className).toContain(expectedClass)
    })
  })
})
