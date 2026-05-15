import type { Meta, StoryObj } from '@storybook/react'
import { Textarea } from './Textarea'

const meta = {
  title: 'Inputs/Textarea',
  component: Textarea,
  tags: ['autodocs'],
} satisfies Meta<typeof Textarea>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = { args: { placeholder: 'Type your message...' } }
export const WithLabel: Story = { args: { label: 'Message', placeholder: 'Tell us about your project...' } }
export const Tall: Story = { args: { label: 'Description', placeholder: 'Provide detailed information...', rows: 8 } }
export const WithValue: Story = {
  args: {
    label: 'Pre-filled',
    value: 'This field already has content that the user can edit.',
  },
}
