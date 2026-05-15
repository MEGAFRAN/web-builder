import type { Meta, StoryObj } from '@storybook/react'
import { Select } from './Select'

const meta = {
  title: 'Inputs/Select',
  component: Select,
  tags: ['autodocs'],
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { options: ['Option A', 'Option B', 'Option C'] },
}
export const WithLabel: Story = {
  args: { label: 'Industry', options: ['Retail', 'Healthcare', 'Technology', 'Finance'] },
}
export const WithPlaceholder: Story = {
  args: { label: 'Service type', placeholder: 'Select a service...', options: ['Consulting', 'Design', 'Development'] },
}
export const Preselected: Story = {
  args: { label: 'Country', options: ['Spain', 'Mexico', 'Argentina'], value: 'Mexico' },
}
