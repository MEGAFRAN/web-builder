import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './Button'

const meta = {
  title: 'Inputs/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'ghost', 'destructive'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = { args: { label: 'Click me', variant: 'primary', size: 'md' } }
export const Secondary: Story = { args: { label: 'Cancel', variant: 'secondary', size: 'md' } }
export const Ghost: Story = { args: { label: 'Learn more', variant: 'ghost', size: 'md' } }
export const Destructive: Story = { args: { label: 'Delete', variant: 'destructive', size: 'md' } }
export const Disabled: Story = { args: { label: 'Unavailable', variant: 'primary', disabled: true } }
export const Small: Story = { args: { label: 'Small', variant: 'primary', size: 'sm' } }
export const Large: Story = { args: { label: 'Get started', variant: 'primary', size: 'lg' } }
