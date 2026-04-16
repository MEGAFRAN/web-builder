import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Textarea } from '@/components/inputs/Textarea'

// ─── Helper ───────────────────────────────────────────────────────────────────

function renderTextarea(props: React.ComponentProps<typeof Textarea> = {}) {
  const { container } = render(<Textarea {...props} />)
  return container
}

function getRoot(container: HTMLElement) {
  return container.querySelector('div[data-component="textarea"]') as HTMLDivElement
}

function getTextarea(container: HTMLElement) {
  return container.querySelector('textarea') as HTMLTextAreaElement
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Textarea', () => {
  describe('root element', () => {
    it('renders a <div> with data-component="textarea"', () => {
      const container = renderTextarea()
      expect(getRoot(container)).not.toBeNull()
    })
  })

  describe('label prop', () => {
    it('renders a <label> with correct text when label is provided', () => {
      renderTextarea({ label: 'Your message' })
      expect(screen.getByText('Your message').tagName).toBe('LABEL')
    })

    it('does not render a <label> when label is omitted', () => {
      const container = renderTextarea()
      expect(container.querySelector('label')).toBeNull()
    })

    it('does not render a <label> when label={null}', () => {
      const container = renderTextarea({ label: null })
      expect(container.querySelector('label')).toBeNull()
    })
  })

  describe('placeholder prop', () => {
    it('sets the correct placeholder when provided', () => {
      const container = renderTextarea({ placeholder: 'Write something…' })
      expect(getTextarea(container).placeholder).toBe('Write something…')
    })

    it('falls back to "" when placeholder is omitted', () => {
      const container = renderTextarea()
      expect(getTextarea(container).placeholder).toBe('')
    })

    it('falls back to "" when placeholder={null}', () => {
      const container = renderTextarea({ placeholder: null })
      expect(getTextarea(container).placeholder).toBe('')
    })
  })

  describe('value (initialValue) prop', () => {
    it('sets the initial value when value is provided', () => {
      const container = renderTextarea({ value: 'Hello world' })
      expect(getTextarea(container).value).toBe('Hello world')
    })

    it('starts empty when value is omitted', () => {
      const container = renderTextarea()
      expect(getTextarea(container).value).toBe('')
    })

    it('starts empty when value={null}', () => {
      const container = renderTextarea({ value: null })
      expect(getTextarea(container).value).toBe('')
    })
  })

  describe('rows prop', () => {
    it('sets rows attribute to the provided value', () => {
      const container = renderTextarea({ rows: 6 })
      expect(getTextarea(container).rows).toBe(6)
    })

    it('defaults to 4 when rows is omitted', () => {
      const container = renderTextarea()
      expect(getTextarea(container).rows).toBe(4)
    })

    it('defaults to 4 when rows={null}', () => {
      const container = renderTextarea({ rows: null })
      expect(getTextarea(container).rows).toBe(4)
    })
  })

  describe('required prop', () => {
    it('sets required when required={true}', () => {
      const container = renderTextarea({ required: true })
      expect(getTextarea(container).required).toBe(true)
    })

    it('does not set required when required={false}', () => {
      const container = renderTextarea({ required: false })
      expect(getTextarea(container).required).toBe(false)
    })

    it('defaults to false (not required) when required is omitted', () => {
      const container = renderTextarea()
      expect(getTextarea(container).required).toBe(false)
    })

    it('defaults to false (not required) when required={null}', () => {
      const container = renderTextarea({ required: null })
      expect(getTextarea(container).required).toBe(false)
    })
  })

  describe('controlled input behaviour', () => {
    it('updates the displayed value when the user types', () => {
      const container = renderTextarea()
      const textarea = getTextarea(container)
      fireEvent.change(textarea, { target: { value: 'typed text' } })
      expect(textarea.value).toBe('typed text')
    })

    it('replaces an initial value when the user types', () => {
      const container = renderTextarea({ value: 'initial' })
      const textarea = getTextarea(container)
      fireEvent.change(textarea, { target: { value: 'updated' } })
      expect(textarea.value).toBe('updated')
    })
  })
})
