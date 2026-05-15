import type { Meta, StoryObj } from '@storybook/react'
import { Badge } from './Badge'

const meta = {
  title: 'Content/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['default', 'success', 'warning', 'error'] },
  },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = { args: { label: 'Tag', variant: 'default' } }
export const Success: Story = { args: { label: 'Active', variant: 'success' } }
export const Warning: Story = { args: { label: 'Pending', variant: 'warning' } }
export const Error: Story = { args: { label: 'Expired', variant: 'error' } }
