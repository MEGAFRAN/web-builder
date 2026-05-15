import type { Meta, StoryObj } from '@storybook/react'
import HeroBlock from './HeroBlock'

const meta = {
  title: 'Blocks/HeroBlock',
  component: HeroBlock,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof HeroBlock>

export default meta
type Story = StoryObj<typeof meta>

export const WithCta: Story = {
  args: {
    _type: 'hero',
    title: 'Build something great',
    subtitle: 'A modern platform for modern teams.',
    cta: { label: 'Get started', href: '/contact' },
  },
}
export const NoSubtitle: Story = {
  args: { _type: 'hero', title: 'Simple. Powerful. Fast.' },
}
export const NoCta: Story = {
  args: { _type: 'hero', title: 'Welcome to Acme', subtitle: 'We build great things for great people.' },
}
