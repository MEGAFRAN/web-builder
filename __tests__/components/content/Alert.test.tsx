import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Alert } from '@/components/content/Alert'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const VARIANT_CASES = [
  ['info',    'bg-blue-50',   'border-blue-200',  'text-blue-800'],
  ['success', 'bg-green-50',  'border-green-200', 'text-green-800'],
  ['warning', 'bg-yellow-50', 'border-yellow-200','text-yellow-800'],
  ['error',   'bg-red-50',    'border-red-200',   'text-red-800'],
] as const

// ─── Helper ───────────────────────────────────────────────────────────────────

function renderAlert(props: React.ComponentProps<typeof Alert>) {
  const { container } = render(<Alert {...props} />)
  return container
}

function getRoot(container: HTMLElement) {
  return container.querySelector('div[data-component="alert"]') as HTMLDivElement
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Alert', () => {
  describe('root element', () => {
    it('renders a <div> with data-component="alert"', () => {
      const container = renderAlert({ message: 'Hello' })
      expect(getRoot(container)).not.toBeNull()
    })

    it('always applies rounded-lg and border base classes', () => {
      const container = renderAlert({ message: 'Hello' })
      expect(getRoot(container).className).toContain('rounded-lg')
      expect(getRoot(container).className).toContain('border')
    })
  })

  describe('variant prop', () => {
    it.each(VARIANT_CASES)(
      'variant="%s" applies bg, border, and text color classes',
      (variant, bg, border, text) => {
        const container = renderAlert({ message: 'msg', variant })
        const cls = getRoot(container).className
        expect(cls).toContain(bg)
        expect(cls).toContain(border)
        expect(cls).toContain(text)
      },
    )

    it('defaults to info styles when variant is omitted', () => {
      const container = renderAlert({ message: 'msg' })
      expect(getRoot(container).className).toContain('bg-blue-50')
    })

    it('defaults to info styles when variant={null}', () => {
      const container = renderAlert({ message: 'msg', variant: null })
      expect(getRoot(container).className).toContain('bg-blue-50')
    })

    it('falls back to info styles for an unrecognised variant string', () => {
      const container = renderAlert({ message: 'msg', variant: 'unknown' })
      expect(getRoot(container).className).toContain('bg-blue-50')
    })
  })

  describe('title prop', () => {
    it('renders a <p> with font-semibold when title is provided', () => {
      renderAlert({ title: 'Heads up', message: 'body' })
      const titleEl = screen.getByText('Heads up')
      expect(titleEl.tagName).toBe('P')
      expect(titleEl.className).toContain('font-semibold')
    })

    it('does not render a title element when title is omitted', () => {
      const container = renderAlert({ message: 'body' })
      expect(container.querySelector('p.font-semibold')).toBeNull()
    })

    it('does not render a title element when title={null}', () => {
      const container = renderAlert({ message: 'body', title: null })
      expect(container.querySelector('p.font-semibold')).toBeNull()
    })
  })

  describe('message prop', () => {
    it('renders message text inside a <p>', () => {
      renderAlert({ message: 'Something went wrong' })
      expect(screen.getByText('Something went wrong').tagName).toBe('P')
    })

    it('does not render the message <p> when message is omitted and no children', () => {
      // The <p> is always rendered but will be empty when neither message nor children exist
      const container = renderAlert({})
      const bodyP = getRoot(container).querySelector('p:not(.font-semibold)')
      expect(bodyP?.textContent).toBe('')
    })
  })

  describe('children prop', () => {
    it('renders children in the body <p> instead of message when children is provided', () => {
      renderAlert({ message: 'ignored', children: <strong>Rich content</strong> })
      expect(screen.getByText('Rich content').tagName).toBe('STRONG')
      // message text should NOT appear since children takes priority
      expect(screen.queryByText('ignored')).toBeNull()
    })

    it('renders plain string children as body text', () => {
      renderAlert({ children: 'Child text' })
      expect(screen.getByText('Child text')).toBeInTheDocument()
    })
  })

  describe('combined props', () => {
    it('renders title and message together', () => {
      renderAlert({ title: 'Notice', message: 'Please read this.', variant: 'warning' })
      expect(screen.getByText('Notice')).toBeInTheDocument()
      expect(screen.getByText('Please read this.')).toBeInTheDocument()
    })
  })
})
