import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Modal } from '@/components/layout/Modal'

beforeEach(() => {
  document.body.style.overflow = ''
})

function setupModal(props: Partial<React.ComponentProps<typeof Modal>> = {}) {
  const { children, onClose: onCloseProp, ...rest } = props
  const onClose = onCloseProp ?? vi.fn()
  const utils = render(
    <Modal isOpen={true} onClose={onClose} title="Modal title" {...rest}>
      {children ?? <p>Modal body</p>}
    </Modal>,
  )
  const dialog = () => screen.getByRole('dialog')
  /** Direct child backdrop (before elevated panel); receives programmatic overlay clicks */
  const backdrop = () => dialog().firstElementChild as HTMLElement

  return { ...utils, onClose, dialog, backdrop }
}

describe('Modal', () => {
  describe('visibility', () => {
    it('renders nothing in the accessibility tree when isOpen={false}', () => {
      const onClose = vi.fn()
      render(
        <Modal isOpen={false} onClose={onClose}>
          hello
        </Modal>,
      )
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('does not mutate body overflow when mounted closed', () => {
      const onClose = vi.fn()
      render(
        <Modal isOpen={false} onClose={onClose}>
          hello
        </Modal>,
      )
      expect(document.body.style.overflow).toBe('')
    })

    it('renders dialog, title, children, and backdrop when open', () => {
      setupModal({
        title: 'Book now',
        children: <span>unique-child-xyz</span>,
      })

      const dialogEl = screen.getByRole('dialog')
      expect(dialogEl).toBeInTheDocument()
      expect(dialogEl.firstElementChild).not.toHaveAttribute(
        'data-component',
      )
      expect(document.querySelector('[data-component="modal"]')).not.toBeNull()

      expect(screen.getByRole('heading', { name: 'Book now' })).toBeInTheDocument()
      expect(screen.getByText('unique-child-xyz')).toBeInTheDocument()
    })
  })

  describe('Accessibility & structure', () => {
    it('exposes role="dialog", aria-modal, and labelled panel markup', () => {
      setupModal({ title: 'Service details' })

      const el = screen.getByRole('dialog')
      expect(el).toHaveAttribute('aria-modal', 'true')
      expect(el).toHaveAttribute('aria-label', 'Service details')

      expect(document.querySelector('[data-component="modal"]')).not.toBeNull()

      expect(screen.getByRole('button', { name: 'Go back' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
    })

    it('omits heading when title is omitted', () => {
      setupModal({ title: undefined })

      expect(screen.queryByRole('heading')).not.toBeInTheDocument()
      expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-label')
    })
  })

  describe('body scroll lock', () => {
    it('sets overflow hidden while open', () => {
      setupModal()
      expect(document.body.style.overflow).toBe('hidden')
    })

    it('restores body overflow after unmount while open', () => {
      const { unmount } = setupModal()
      expect(document.body.style.overflow).toBe('hidden')
      unmount()
      expect(document.body.style.overflow).toBe('')
    })

    it('restores body overflow after closing via prop', () => {
      const onClose = vi.fn()
      const { rerender } = render(<Modal isOpen onClose={onClose} />)
      expect(document.body.style.overflow).toBe('hidden')

      rerender(<Modal isOpen={false} onClose={onClose} />)

      expect(document.body.style.overflow).toBe('')
    })
  })

  describe('keyboard', () => {
    it('calls onClose when Escape is pressed while open', () => {
      const { onClose } = setupModal()
      fireEvent.keyDown(window, { key: 'Escape' })
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Closing interactions', () => {
    it.each([
      ['Go back mobile control',                     'Go back'],
      ['Close desktop control',                       'Close'],
    ] as const)('calls onClose when activating %s', (_label, ariaName) => {
      const { onClose } = setupModal()

      fireEvent.click(screen.getByRole('button', { name: ariaName }))

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('calls onClose when the backdrop overlay is clicked', () => {
      const { backdrop, onClose } = setupModal()
      fireEvent.click(backdrop())
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('does not call onClose when Escape is pressed while closed', () => {
      const onClose = vi.fn()
      render(<Modal isOpen={false} onClose={onClose} />)
      fireEvent.keyDown(window, { key: 'Escape' })
      expect(onClose).not.toHaveBeenCalled()
    })
  })
})
