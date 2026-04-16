import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Checkbox } from '@/components/inputs/Checkbox'

// ─── Helper ───────────────────────────────────────────────────────────────────

function renderCheckbox(props: React.ComponentProps<typeof Checkbox>) {
  const { container } = render(<Checkbox {...props} />)
  return container
}

function getRoot(container: HTMLElement) {
  return container.querySelector('label[data-component="checkbox"]') as HTMLLabelElement
}

function getCheckbox(container: HTMLElement) {
  return container.querySelector('input[type="checkbox"]') as HTMLInputElement
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Checkbox', () => {
  describe('root element', () => {
    it('renders a <label> with data-component="checkbox"', () => {
      const container = renderCheckbox({ label: 'Accept terms' })
      expect(getRoot(container)).not.toBeNull()
    })

    it('renders the label text inside a <span>', () => {
      const container = renderCheckbox({ label: 'Accept terms' })
      const span = container.querySelector('span')
      expect(span?.textContent).toBe('Accept terms')
    })

    it('the label is accessible via getByText', () => {
      renderCheckbox({ label: 'Subscribe to newsletter' })
      expect(screen.getByText('Subscribe to newsletter')).toBeInTheDocument()
    })
  })

  describe('checked (initialChecked) prop', () => {
    it('renders as checked when checked={true}', () => {
      const container = renderCheckbox({ label: 'Accept', checked: true })
      expect(getCheckbox(container).checked).toBe(true)
    })

    it('renders as unchecked when checked={false}', () => {
      const container = renderCheckbox({ label: 'Accept', checked: false })
      expect(getCheckbox(container).checked).toBe(false)
    })

    it('defaults to unchecked when checked is omitted', () => {
      const container = renderCheckbox({ label: 'Accept' })
      expect(getCheckbox(container).checked).toBe(false)
    })

    it('defaults to unchecked when checked={null}', () => {
      const container = renderCheckbox({ label: 'Accept', checked: null })
      expect(getCheckbox(container).checked).toBe(false)
    })
  })

  describe('controlled toggle behaviour', () => {
    it('toggles to checked when the user clicks an unchecked checkbox', () => {
      const container = renderCheckbox({ label: 'Accept', checked: false })
      const checkbox = getCheckbox(container)
      fireEvent.click(checkbox)
      expect(checkbox.checked).toBe(true)
    })

    it('toggles to unchecked when the user clicks a checked checkbox', () => {
      const container = renderCheckbox({ label: 'Accept', checked: true })
      const checkbox = getCheckbox(container)
      fireEvent.click(checkbox)
      expect(checkbox.checked).toBe(false)
    })

    it('can be toggled multiple times', () => {
      const container = renderCheckbox({ label: 'Accept' })
      const checkbox = getCheckbox(container)
      fireEvent.click(checkbox)
      expect(checkbox.checked).toBe(true)
      fireEvent.click(checkbox)
      expect(checkbox.checked).toBe(false)
      fireEvent.click(checkbox)
      expect(checkbox.checked).toBe(true)
    })

    it('updates when the user clicks the wrapping label', () => {
      // Clicking the <label> element itself should relay to its checkbox child
      const container = renderCheckbox({ label: 'Accept' })
      const label = getRoot(container)
      fireEvent.click(label)
      expect(getCheckbox(container).checked).toBe(true)
    })
  })
})
