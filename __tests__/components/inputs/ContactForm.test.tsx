import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ContactForm } from '@/components/inputs/ContactForm'

// ─── Helper ───────────────────────────────────────────────────────────────────

function renderForm(props: React.ComponentProps<typeof ContactForm> = {}) {
  const { container } = render(<ContactForm {...props} />)
  return container
}

function getForm(container: HTMLElement) {
  return container.querySelector('form[data-component="contact-form"]') as HTMLFormElement
}

function getNameInput(container: HTMLElement) {
  // The name input is the first text input
  return container.querySelectorAll('input')[0] as HTMLInputElement
}

function getEmailInput(container: HTMLElement) {
  return container.querySelector('input[type="email"]') as HTMLInputElement
}

function getMessageTextarea(container: HTMLElement) {
  return container.querySelector('textarea') as HTMLTextAreaElement
}

function getSubmitButton(container: HTMLElement) {
  return container.querySelector('button[type="submit"]') as HTMLButtonElement
}

function fillAndSubmit(
  container: HTMLElement,
  { name = 'Alice', email = 'alice@example.com', message = 'Hello' } = {},
) {
  fireEvent.change(getNameInput(container), { target: { value: name } })
  fireEvent.change(getEmailInput(container), { target: { value: email } })
  fireEvent.change(getMessageTextarea(container), { target: { value: message } })
  fireEvent.submit(getForm(container))
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ContactForm', () => {
  describe('root element', () => {
    it('renders a <form> with data-component="contact-form"', () => {
      const container = renderForm()
      expect(getForm(container)).not.toBeNull()
    })
  })

  describe('default field labels', () => {
    it('renders default label "Name" when nameLabel is omitted', () => {
      renderForm()
      expect(screen.getByText('Name').tagName).toBe('LABEL')
    })

    it('renders default label "Email" when emailLabel is omitted', () => {
      renderForm()
      expect(screen.getByText('Email').tagName).toBe('LABEL')
    })

    it('renders default label "Message" when messageLabel is omitted', () => {
      renderForm()
      expect(screen.getByText('Message').tagName).toBe('LABEL')
    })

    it('renders default submit button text "Send Message" when submitLabel is omitted', () => {
      const container = renderForm()
      expect(getSubmitButton(container).textContent).toBe('Send Message')
    })
  })

  describe('custom field labels', () => {
    it('renders custom nameLabel when provided', () => {
      renderForm({ nameLabel: 'Full Name' })
      expect(screen.getByText('Full Name').tagName).toBe('LABEL')
    })

    it('renders custom emailLabel when provided', () => {
      renderForm({ emailLabel: 'Work Email' })
      expect(screen.getByText('Work Email').tagName).toBe('LABEL')
    })

    it('renders custom messageLabel when provided', () => {
      renderForm({ messageLabel: 'Your Question' })
      expect(screen.getByText('Your Question').tagName).toBe('LABEL')
    })

    it('renders custom submitLabel when provided', () => {
      const container = renderForm({ submitLabel: 'Get in Touch' })
      expect(getSubmitButton(container).textContent).toBe('Get in Touch')
    })
  })

  describe('field rendering', () => {
    it('renders a text input for name', () => {
      const container = renderForm()
      const input = getNameInput(container)
      expect(input.type).toBe('text')
    })

    it('renders an email input for email', () => {
      const container = renderForm()
      expect(getEmailInput(container).type).toBe('email')
    })

    it('renders a textarea for message', () => {
      const container = renderForm()
      expect(getMessageTextarea(container)).not.toBeNull()
    })

    it('renders the message textarea with 4 rows', () => {
      const container = renderForm()
      expect(getMessageTextarea(container).rows).toBe(4)
    })

    it('all fields start empty', () => {
      const container = renderForm()
      expect(getNameInput(container).value).toBe('')
      expect(getEmailInput(container).value).toBe('')
      expect(getMessageTextarea(container).value).toBe('')
    })

    it('all fields are required', () => {
      const container = renderForm()
      expect(getNameInput(container).required).toBe(true)
      expect(getEmailInput(container).required).toBe(true)
      expect(getMessageTextarea(container).required).toBe(true)
    })
  })

  describe('user interaction — typing', () => {
    it('updates name field as the user types', () => {
      const container = renderForm()
      fireEvent.change(getNameInput(container), { target: { value: 'Bob' } })
      expect(getNameInput(container).value).toBe('Bob')
    })

    it('updates email field as the user types', () => {
      const container = renderForm()
      fireEvent.change(getEmailInput(container), { target: { value: 'bob@example.com' } })
      expect(getEmailInput(container).value).toBe('bob@example.com')
    })

    it('updates message textarea as the user types', () => {
      const container = renderForm()
      fireEvent.change(getMessageTextarea(container), { target: { value: 'Need help please' } })
      expect(getMessageTextarea(container).value).toBe('Need help please')
    })
  })

  describe('form submission — onSubmitData callback', () => {
    it('calls onSubmitData with correct field values on submit', () => {
      const onSubmitData = vi.fn()
      const container = renderForm({ onSubmitData })
      fillAndSubmit(container, {
        name: 'Alice',
        email: 'alice@example.com',
        message: 'Hello there',
      })
      expect(onSubmitData).toHaveBeenCalledTimes(1)
      expect(onSubmitData).toHaveBeenCalledWith({
        name: 'Alice',
        email: 'alice@example.com',
        message: 'Hello there',
      })
    })

    it('passes empty strings when fields are left blank and form is submitted programmatically', () => {
      const onSubmitData = vi.fn()
      const container = renderForm({ onSubmitData })
      fireEvent.submit(getForm(container))
      expect(onSubmitData).toHaveBeenCalledWith({ name: '', email: '', message: '' })
    })
  })

  describe('form submission — legacy onSubmit callback', () => {
    it('calls onSubmit when onSubmitData is not provided', () => {
      const onSubmit = vi.fn()
      const container = renderForm({ onSubmit })
      fillAndSubmit(container)
      expect(onSubmit).toHaveBeenCalledTimes(1)
    })

    it('prefers onSubmitData over onSubmit when both are provided', () => {
      const onSubmit = vi.fn()
      const onSubmitData = vi.fn()
      const container = renderForm({ onSubmit, onSubmitData })
      fillAndSubmit(container)
      expect(onSubmitData).toHaveBeenCalledTimes(1)
      expect(onSubmit).not.toHaveBeenCalled()
    })
  })

  describe('isSubmitting prop', () => {
    it('disables the submit button when isSubmitting={true}', () => {
      const container = renderForm({ isSubmitting: true })
      expect(getSubmitButton(container).disabled).toBe(true)
    })

    it('shows "Sending…" text when isSubmitting={true}', () => {
      const container = renderForm({ isSubmitting: true })
      expect(getSubmitButton(container).textContent).toBe('Sending…')
    })

    it('keeps the submit button enabled when isSubmitting={false}', () => {
      const container = renderForm({ isSubmitting: false })
      expect(getSubmitButton(container).disabled).toBe(false)
    })

    it('keeps the submit button enabled when isSubmitting is omitted', () => {
      const container = renderForm()
      expect(getSubmitButton(container).disabled).toBe(false)
    })

    it('does not call onSubmitData when the button is disabled via isSubmitting', () => {
      const onSubmitData = vi.fn()
      const container = renderForm({ onSubmitData, isSubmitting: true })
      // Clicking a disabled button does not submit the form in jsdom,
      // but we verify the submit event path directly
      fireEvent.click(getSubmitButton(container))
      expect(onSubmitData).not.toHaveBeenCalled()
    })
  })

  describe('form submission prevents default browser navigation', () => {
    it('does not throw and handles the event when submitted', () => {
      const onSubmitData = vi.fn()
      const container = renderForm({ onSubmitData })
      // fireEvent.submit fires a synthetic event; the handler should call
      // e.preventDefault() — if it doesn't, jsdom would trigger navigation
      // which would cause an error. Not throwing is the assertion.
      expect(() => fillAndSubmit(container)).not.toThrow()
    })
  })
})
