'use client'

import { useEffect, useRef } from 'react'

interface AdminModalProps {
  open: boolean
  title: string
  labelledById: string
  descriptionId?: string
  onClose: () => void
  footer?: React.ReactNode
  children: React.ReactNode
}

export function AdminModal({
  open,
  title,
  labelledById,
  descriptionId,
  onClose,
  footer,
  children,
}: AdminModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open) {
      if (!dialog.open) dialog.showModal()
    } else {
      if (dialog.open) dialog.close()
    }
  }, [open])

  // Close on native dialog cancel (Escape key)
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const handleCancel = (e: Event) => {
      e.preventDefault()
      onClose()
    }
    dialog.addEventListener('cancel', handleCancel)
    return () => dialog.removeEventListener('cancel', handleCancel)
  }, [onClose])

  if (!open) return null

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={labelledById}
      aria-describedby={descriptionId}
      className="m-auto w-full max-w-lg rounded-xl border border-border bg-background p-0 shadow-xl backdrop:bg-black/40 open:flex open:flex-col"
      onClick={(e) => {
        // Close when clicking the backdrop (dialog element itself, not its children)
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 id={labelledById} className="text-base font-semibold text-foreground">
          {title}
        </h2>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="rounded-md p-1.5 text-muted hover:bg-muted-bg hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path
              d="M12 4L4 12M4 4l8 8"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto px-5 py-4">{children}</div>

      {/* Footer */}
      {footer && (
        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">{footer}</div>
      )}
    </dialog>
  )
}
