import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Select } from '@/components/inputs/Select'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const OPTIONS = ['Apple', 'Banana', 'Cherry']

// ─── Helper ───────────────────────────────────────────────────────────────────

function renderSelect(props: React.ComponentProps<typeof Select> = { options: OPTIONS }) {
  const { container } = render(<Select {...props} />)
  return container
}

function getRoot(container: HTMLElement) {
  return container.querySelector('div[data-component="select"]') as HTMLDivElement
}

function getSelect(container: HTMLElement) {
  return container.querySelector('select') as HTMLSelectElement
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Select', () => {
  describe('root element', () => {
    it('renders a <div> with data-component="select"', () => {
      const container = renderSelect()
      expect(getRoot(container)).not.toBeNull()
    })
  })

  describe('label prop', () => {
    it('renders a <label> with correct text when label is provided', () => {
      renderSelect({ options: OPTIONS, label: 'Fruit' })
      expect(screen.getByText('Fruit').tagName).toBe('LABEL')
    })

    it('does not render a <label> when label is omitted', () => {
      const container = renderSelect({ options: OPTIONS })
      expect(container.querySelector('label')).toBeNull()
    })

    it('does not render a <label> when label={null}', () => {
      const container = renderSelect({ options: OPTIONS, label: null })
      expect(container.querySelector('label')).toBeNull()
    })
  })

  describe('placeholder prop', () => {
    it('renders an <option value=""> with placeholder text as first option when provided', () => {
      const container = renderSelect({ options: OPTIONS, placeholder: 'Pick one' })
      const opts = container.querySelectorAll('option')
      expect(opts[0].value).toBe('')
      expect(opts[0].textContent).toBe('Pick one')
    })

    it('does not render a placeholder <option> when placeholder is omitted', () => {
      const container = renderSelect({ options: OPTIONS })
      const opts = Array.from(container.querySelectorAll('option'))
      expect(opts.some((o) => o.value === '')).toBe(false)
    })

    it('does not render a placeholder <option> when placeholder={null}', () => {
      const container = renderSelect({ options: OPTIONS, placeholder: null })
      const opts = Array.from(container.querySelectorAll('option'))
      expect(opts.some((o) => o.value === '')).toBe(false)
    })
  })

  describe('options prop', () => {
    it('renders all provided strings as <option> elements with matching value and text', () => {
      const container = renderSelect({ options: OPTIONS })
      const opts = Array.from(container.querySelectorAll('option'))
      OPTIONS.forEach((label, i) => {
        expect(opts[i].value).toBe(label)
        expect(opts[i].textContent).toBe(label)
      })
    })

    it('renders no option elements (besides placeholder) when options is an empty array', () => {
      const container = renderSelect({ options: [], placeholder: 'Choose' })
      const opts = container.querySelectorAll('option')
      // Only the placeholder option should be present
      expect(opts).toHaveLength(1)
      expect(opts[0].value).toBe('')
    })

    it('renders no option elements at all when options is [] and no placeholder', () => {
      const container = renderSelect({ options: [] })
      expect(container.querySelectorAll('option')).toHaveLength(0)
    })

    it('does not throw when options is undefined (optional-chaining guard)', () => {
      // The TypeScript interface marks options as required, but the implementation
      // guards with `options?.map`. We verify the runtime safety with @ts-expect-error.
      expect(() => {
        // @ts-expect-error — deliberately passing undefined to test the runtime guard
        renderSelect({ options: undefined })
      }).not.toThrow()
    })
  })

  describe('value (initialValue) prop', () => {
    it('pre-selects the provided value', () => {
      const container = renderSelect({ options: OPTIONS, value: 'Banana' })
      expect(getSelect(container).value).toBe('Banana')
    })

    it('starts with "" (no option selected) when value is omitted and a placeholder is present', () => {
      // When a placeholder option with value="" exists, the select can reflect ""
      const container = renderSelect({ options: OPTIONS, placeholder: 'Pick one' })
      expect(getSelect(container).value).toBe('')
    })

    it('falls back to the first option when value is omitted and no placeholder exists', () => {
      // Browser/jsdom behaviour: when the internal state is "" but no option has
      // value="", the DOM auto-selects the first available option.
      const container = renderSelect({ options: OPTIONS })
      expect(getSelect(container).value).toBe(OPTIONS[0])
    })

    it('starts with "" (no option selected) when value={null} and a placeholder is present', () => {
      const container = renderSelect({ options: OPTIONS, placeholder: 'Pick one', value: null })
      expect(getSelect(container).value).toBe('')
    })

    it('falls back to the first option when value={null} and no placeholder exists', () => {
      const container = renderSelect({ options: OPTIONS, value: null })
      expect(getSelect(container).value).toBe(OPTIONS[0])
    })
  })

  describe('controlled behaviour', () => {
    it('updates the displayed selected value when the user changes the select', () => {
      const container = renderSelect({ options: OPTIONS })
      const select = getSelect(container)
      fireEvent.change(select, { target: { value: 'Cherry' } })
      expect(select.value).toBe('Cherry')
    })

    it('replaces an initial value when the user changes the select', () => {
      const container = renderSelect({ options: OPTIONS, value: 'Apple' })
      const select = getSelect(container)
      fireEvent.change(select, { target: { value: 'Banana' } })
      expect(select.value).toBe('Banana')
    })
  })
})
