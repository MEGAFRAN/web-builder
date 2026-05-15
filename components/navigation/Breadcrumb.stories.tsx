import type { Meta, StoryObj } from '@storybook/react'
import { Breadcrumb } from './Breadcrumb'

const meta = {
  title: 'Navigation/Breadcrumb',
  component: Breadcrumb,
  tags: ['autodocs'],
} satisfies Meta<typeof Breadcrumb>

export default meta
type Story = StoryObj<typeof meta>

export const SingleItem: Story = {
  args: { items: [{ label: 'Home' }] },
}
export const TwoItems: Story = {
  args: { items: [{ label: 'Home', href: '/' }, { label: 'Services' }] },
}
export const ThreeItems: Story = {
  args: {
    items: [
      { label: 'Home', href: '/' },
      { label: 'Services', href: '/services' },
      { label: 'Hair & Style' },
    ],
  },
}
