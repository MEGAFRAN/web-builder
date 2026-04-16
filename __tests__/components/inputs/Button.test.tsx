import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/inputs/Button'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const VARIANT_CASES = [
  ['primary',     'bg-primary'],
  ['secondary',   'border-border'],
  ['ghost',       'hover:bg-muted-bg'],
  ['destructive', 'bg-destructive'],
] as const

const SIZE_CASES = [
  ['sm', 'px-3'],
  ['md', 'px-4'],
  ['lg', 'px-6'],
] as const

// ─── Helper ───────────────────────────────────────────────────────────────────

function renderButton(props: React.ComponentProps<typeof Button>) {
  const { container } = render(<Button {...props} />)
  return container
}

function getButton(container: HTMLElement) {
  return container.querySelector('button[data-component="button"]') as HTMLButtonElement
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Button', () => {
  describe('root element', () => {
    it('renders a <button> with data-component="button"', () => {
      const container = renderButton({ label: 'Click me' })
      expect(getButton(container)).not.toBeNull()
    })
  })

  describe('label prop', () => {
    it('renders the label text inside the button', () => {
      renderButton({ label: 'Submit' })
      expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument()
    })
  })

  describe('variant prop', () => {
    it.each(VARIANT_CASES)('variant="%s" applies the expected class', (variant, expectedClass) => {
      const container = renderButton({ label: 'Btn', variant })
      expect(getButton(container).className).toContain(expectedClass)
    })

    it('defaults to primary variant when variant is omitted', () => {
      const container = renderButton({ label: 'Btn' })
      expect(getButton(container).className).toContain('bg-primary')
    })

    it('defaults to primary variant when variant={null}', () => {
      const container = renderButton({ label: 'Btn', variant: null })
      expect(getButton(container).className).toContain('bg-primary')
    })

    it('falls back to primary variant for an unrecognised variant string', () => {
      const container = renderButton({ label: 'Btn', variant: 'nonexistent' })
      expect(getButton(container).className).toContain('bg-primary')
    })
  })

  describe('size prop', () => {
    it.each(SIZE_CASES)('size="%s" applies the expected padding class', (size, expectedClass) => {
      const container = renderButton({ label: 'Btn', size })
      expect(getButton(container).className).toContain(expectedClass)
    })

    it('defaults to md size when size is omitted', () => {
      const container = renderButton({ label: 'Btn' })
      expect(getButton(container).className).toContain('px-4')
    })

    it('defaults to md size when size={null}', () => {
      const container = renderButton({ label: 'Btn', size: null })
      expect(getButton(container).className).toContain('px-4')
    })

    it('falls back to md size for an unrecognised size string', () => {
      const container = renderButton({ label: 'Btn', size: 'huge' })
      expect(getButton(container).className).toContain('px-4')
    })
  })

  describe('disabled prop', () => {
    it('disables the button when disabled={true}', () => {
      const container = renderButton({ label: 'Btn', disabled: true })
      expect(getButton(container).disabled).toBe(true)
    })

    it('keeps the button enabled when disabled={false}', () => {
      const container = renderButton({ label: 'Btn', disabled: false })
      expect(getButton(container).disabled).toBe(false)
    })

    it('is not disabled by default when disabled is omitted', () => {
      const container = renderButton({ label: 'Btn' })
      expect(getButton(container).disabled).toBe(false)
    })

    it('is not disabled when disabled={null}', () => {
      const container = renderButton({ label: 'Btn', disabled: null })
      expect(getButton(container).disabled).toBe(false)
    })

    it('applies disabled:opacity-50 class when disabled', () => {
      const container = renderButton({ label: 'Btn', disabled: true })
      expect(getButton(container).className).toContain('disabled:opacity-50')
    })
  })

  describe('onClick interaction', () => {
    it('calls onClick handler when clicked', () => {
      const handler = vi.fn()
      const container = renderButton({ label: 'Btn', onClick: handler })
      fireEvent.click(getButton(container))
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('does not call onClick when the button is disabled', () => {
      const handler = vi.fn()
      const container = renderButton({ label: 'Btn', onClick: handler, disabled: true })
      fireEvent.click(getButton(container))
      expect(handler).not.toHaveBeenCalled()
    })

    it('calls onClick multiple times for multiple clicks', () => {
      const handler = vi.fn()
      const container = renderButton({ label: 'Btn', onClick: handler })
      const btn = getButton(container)
      fireEvent.click(btn)
      fireEvent.click(btn)
      fireEvent.click(btn)
      expect(handler).toHaveBeenCalledTimes(3)
    })
  })
})
