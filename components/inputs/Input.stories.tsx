import type { Meta, StoryObj } from '@storybook/react'
import { Input } from './Input'

const meta = {
  title: 'Inputs/Input',
  component: Input,
  tags: ['autodocs'],
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = { args: { placeholder: 'Enter text...' } }
export const WithLabel: Story = { args: { label: 'Full name', placeholder: 'Jane Doe' } }
export const Email: Story = { args: { label: 'Email address', type: 'email', placeholder: 'jane@example.com' } }
export const Required: Story = { args: { label: 'Required field', placeholder: 'Cannot be empty', required: true } }
export const WithValue: Story = { args: { label: 'Pre-filled', value: 'Jane Doe' } }
