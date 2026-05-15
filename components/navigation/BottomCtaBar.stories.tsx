import type { Meta, StoryObj } from '@storybook/react'
import { BottomCtaBar } from './BottomCtaBar'

const meta = {
  title: 'Navigation/BottomCtaBar',
  component: BottomCtaBar,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof BottomCtaBar>

export default meta
type Story = StoryObj<typeof meta>

export const TwoItems: Story = {
  args: {
    items: [
      { label: 'Call us', href: 'tel:+34600000000', icon: '📞' },
      { label: 'WhatsApp', href: 'https://wa.me/34600000000', icon: '💬' },
    ],
  },
}

export const ThreeItems: Story = {
  args: {
    items: [
      { label: 'Call', href: 'tel:+34600000000', icon: '📞' },
      { label: 'WhatsApp', href: 'https://wa.me/34600000000', icon: '💬' },
      { label: 'Book', href: '/book' },
    ],
  },
}
