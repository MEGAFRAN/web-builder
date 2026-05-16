import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Modal } from './Modal'
import { Button } from '@/components/inputs/Button'

const meta = {
  title: 'Layout/Modal',
  component: Modal,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Modal>

export default meta
type Story = StoryObj<typeof meta>

function ModalDemo({ title }: { title?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <div style={{ padding: '2rem' }}>
        <Button label="Open modal" onClick={() => setOpen(true)} />
      </div>
      <Modal isOpen={open} onClose={() => setOpen(false)} title={title}>
        <p style={{ color: 'var(--color-text)' }}>
          This is modal content. Press Escape or click the close button to dismiss.
        </p>
      </Modal>
    </>
  )
}

export const WithTitle: Story = {
  args: {
    isOpen: false,
    onClose: () => {},
    title: 'Confirm action',
  },
  render: () => <ModalDemo title="Confirm action" />,
}
export const NoTitle: Story = {
  args: {
    isOpen: false,
    onClose: () => {},
  },
  render: () => <ModalDemo />,
}
