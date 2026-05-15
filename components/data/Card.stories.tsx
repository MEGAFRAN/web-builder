import type { Meta, StoryObj } from '@storybook/react'
import { Card } from './Card'

const meta = {
  title: 'Data/Card',
  component: Card,
  tags: ['autodocs'],
  argTypes: {
    padding: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const TitleOnly: Story = { args: { title: 'Card Title' } }
export const WithDescription: Story = {
  args: { title: 'Card Title', description: 'A short description that provides context for this card.' },
}
export const WithFooter: Story = {
  args: {
    title: 'Service Plan',
    description: 'Includes all core features and priority email support.',
    footer: 'Billed monthly. Cancel anytime.',
  },
}
export const NoBorder: Story = {
  args: { title: 'Borderless Card', description: 'This card has no visible border.', border: false },
}
export const SmallPadding: Story = {
  args: { title: 'Compact', description: 'Uses sm padding for dense layouts.', padding: 'sm' },
}
