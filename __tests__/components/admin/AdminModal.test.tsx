import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AdminModal } from '@/components/admin/AdminModal'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('AdminModal', () => {
  it('renders nothing when open={false}', () => {
    render(
      <AdminModal open={false} title="Hidden" labelledById="hid-title" onClose={vi.fn()}>
        Body
      </AdminModal>,
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders dialog with title, body, optional footer, and accessibility wiring when open', () => {
    const onClose = vi.fn()
    render(
      <AdminModal
        open
        title="Edit item"
        labelledById="modal-title"
        descriptionId="modal-desc"
        onClose={onClose}
        footer={<button type="button">Footer action</button>}
      >
        <p id="modal-desc">Describe me</p>
        <span>Main content</span>
      </AdminModal>,
    )

    const dlg = screen.getByRole('dialog')
    expect(dlg).toHaveAttribute('aria-labelledby', 'modal-title')
    expect(dlg).toHaveAttribute('aria-describedby', 'modal-desc')
    expect(screen.getByRole('heading', { name: 'Edit item' })).toHaveAttribute('id', 'modal-title')
    expect(screen.getByText('Main content')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Footer action' })).toBeInTheDocument()
  })

  it.each([
    ['close button', () => screen.getByRole('button', { name: 'Close' })],
    ['backdrop click on dialog surface', () => screen.getByRole('dialog')],
  ] as const)('calls onClose when activating %s', (_label, getTarget) => {
    const onClose = vi.fn()
    render(
      <AdminModal open title="T" labelledById="t-id" onClose={onClose}>
        X
      </AdminModal>,
    )
    fireEvent.click(getTarget())
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose when clicking dialog children (event target differs)', () => {
    const onClose = vi.fn()
    render(
      <AdminModal open title="T" labelledById="t-id" onClose={onClose}>
        <button type="button">Inside</button>
      </AdminModal>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Inside' }))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('calls onClose when the dialog fires a cancel event', () => {
    const onClose = vi.fn()
    render(
      <AdminModal open title="T" labelledById="t-id" onClose={onClose}>
        Body
      </AdminModal>,
    )
    const dlg = screen.getByRole('dialog')
    dlg.dispatchEvent(new Event('cancel', { cancelable: true }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
