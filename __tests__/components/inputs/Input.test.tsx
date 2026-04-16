import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Input } from '@/components/inputs/Input'

// ─── Helper ───────────────────────────────────────────────────────────────────

function renderInput(props: React.ComponentProps<typeof Input> = {}) {
  const { container } = render(<Input {...props} />)
  return container
}

function getRoot(container: HTMLElement) {
  return container.querySelector('div[data-component="input"]') as HTMLDivElement
}

function getInput(container: HTMLElement) {
  return container.querySelector('input') as HTMLInputElement
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Input', () => {
  describe('root element', () => {
    it('renders a <div> with data-component="input"', () => {
      const container = renderInput()
      expect(getRoot(container)).not.toBeNull()
    })
  })

  describe('label prop', () => {
    it('renders a <label> with correct text when label is provided', () => {
      renderInput({ label: 'Full Name' })
      expect(screen.getByText('Full Name').tagName).toBe('LABEL')
    })

    it('does not render a <label> when label is omitted', () => {
      const container = renderInput()
      expect(container.querySelector('label')).toBeNull()
    })

    it('does not render a <label> when label={null}', () => {
      const container = renderInput({ label: null })
      expect(container.querySelector('label')).toBeNull()
    })
  })

  describe('placeholder prop', () => {
    it('sets the correct placeholder when provided', () => {
      const container = renderInput({ placeholder: 'Enter your name' })
      expect(getInput(container).placeholder).toBe('Enter your name')
    })

    it('falls back to "" when placeholder is omitted', () => {
      const container = renderInput()
      expect(getInput(container).placeholder).toBe('')
    })

    it('falls back to "" when placeholder={null}', () => {
      const container = renderInput({ placeholder: null })
      expect(getInput(container).placeholder).toBe('')
    })
  })

  describe('type prop', () => {
    const TYPE_CASES = [
      ['text',     'text'],
      ['email',    'email'],
      ['password', 'password'],
      ['number',   'number'],
      ['tel',      'tel'],
    ] as const

    it.each(TYPE_CASES)('type="%s" sets input type to "%s"', (typeValue, expected) => {
      const container = renderInput({ type: typeValue })
      expect(getInput(container).type).toBe(expected)
    })

    it('defaults to type="text" when type is omitted', () => {
      const container = renderInput()
      expect(getInput(container).type).toBe('text')
    })

    it('defaults to type="text" when type={null}', () => {
      const container = renderInput({ type: null })
      expect(getInput(container).type).toBe('text')
    })
  })

  describe('value (initialValue) prop', () => {
    it('sets the initial value when value is provided', () => {
      const container = renderInput({ value: 'prefilled text' })
      expect(getInput(container).value).toBe('prefilled text')
    })

    it('starts empty when value is omitted', () => {
      const container = renderInput()
      expect(getInput(container).value).toBe('')
    })

    it('starts empty when value={null}', () => {
      const container = renderInput({ value: null })
      expect(getInput(container).value).toBe('')
    })
  })

  describe('required prop', () => {
    it('sets required when required={true}', () => {
      const container = renderInput({ required: true })
      expect(getInput(container).required).toBe(true)
    })

    it('does not set required when required={false}', () => {
      const container = renderInput({ required: false })
      expect(getInput(container).required).toBe(false)
    })

    it('defaults to false when required is omitted', () => {
      const container = renderInput()
      expect(getInput(container).required).toBe(false)
    })

    it('defaults to false when required={null}', () => {
      const container = renderInput({ required: null })
      expect(getInput(container).required).toBe(false)
    })
  })

  describe('controlled input behaviour', () => {
    it('updates the displayed value when the user types', () => {
      const container = renderInput()
      const input = getInput(container)
      fireEvent.change(input, { target: { value: 'hello' } })
      expect(input.value).toBe('hello')
    })

    it('replaces an initial value when the user types', () => {
      const container = renderInput({ value: 'initial' })
      const input = getInput(container)
      fireEvent.change(input, { target: { value: 'updated' } })
      expect(input.value).toBe('updated')
    })

    it('clears the value when the user deletes all text', () => {
      const container = renderInput({ value: 'some text' })
      const input = getInput(container)
      fireEvent.change(input, { target: { value: '' } })
      expect(input.value).toBe('')
    })
  })
})
