import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ContactFormSection from '@/components/blocks/ContactFormSection'

function fillAndSubmitForm(container: HTMLElement) {
  // ContactForm labels are not associated via htmlFor — query by input type/order
  const inputs = container.querySelectorAll('input, textarea')
  const nameInput = inputs[0] as HTMLInputElement
  const emailInput = inputs[1] as HTMLInputElement
  const messageInput = inputs[2] as HTMLTextAreaElement

  fireEvent.change(nameInput, { target: { value: 'Jane Doe' } })
  fireEvent.change(emailInput, { target: { value: 'jane@example.com' } })
  fireEvent.change(messageInput, { target: { value: 'Hello there' } })
  fireEvent.submit(container.querySelector('form')!)
}

describe('ContactFormSection', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  it('renders the contact form initially', () => {
    const { container } = render(<ContactFormSection />)
    expect(container.querySelector('[data-component="contact-form"]')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument()
  })

  it('shows success alert after a successful submission', async () => {
    fetchSpy.mockResolvedValueOnce({ ok: true } as Response)
    const { container } = render(<ContactFormSection />)
    fillAndSubmitForm(container)
    await waitFor(() =>
      expect(
        screen.getByText(/thank you.*we'll be in touch/i)
      ).toBeInTheDocument()
    )
  })

  it('shows generic error alert when fetch returns non-ok', async () => {
    fetchSpy.mockResolvedValueOnce({ ok: false } as Response)
    const { container } = render(<ContactFormSection />)
    fillAndSubmitForm(container)
    await waitFor(() =>
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    )
  })

  it('includes the fallbackEmail in the error message when provided', async () => {
    fetchSpy.mockResolvedValueOnce({ ok: false } as Response)
    const { container } = render(<ContactFormSection fallbackEmail="support@example.com" />)
    fillAndSubmitForm(container)
    await waitFor(() =>
      expect(screen.getByText(/support@example\.com/)).toBeInTheDocument()
    )
  })

  it('shows generic error message when fetch rejects (network error)', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('Network failure'))
    const { container } = render(<ContactFormSection />)
    fillAndSubmitForm(container)
    await waitFor(() =>
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    )
  })

  it('disables the submit button while submitting', async () => {
    // Use a promise that never resolves to keep the submitting state active
    fetchSpy.mockImplementationOnce(() => new Promise(() => {}))
    const { container } = render(<ContactFormSection />)
    fillAndSubmitForm(container)
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /sending/i })).toBeDisabled()
    )
  })
})
