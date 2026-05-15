import type { Meta, StoryObj } from '@storybook/react'
import { Checkbox } from './Checkbox'

const meta = {
  title: 'Inputs/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
} satisfies Meta<typeof Checkbox>

export default meta
type Story = StoryObj<typeof meta>

export const Unchecked: Story = { args: { label: 'I agree to the terms of service' } }
export const Checked: Story = { args: { label: 'Subscribe to newsletter', checked: true } }
