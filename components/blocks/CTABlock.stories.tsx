import type { Meta, StoryObj } from '@storybook/react'
import CTABlock from './CTABlock'

const meta = {
  title: 'Blocks/CTABlock',
  component: CTABlock,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    background: { control: 'select', options: ['white', 'gray', 'dark'] },
  },
} satisfies Meta<typeof CTABlock>

export default meta
type Story = StoryObj<typeof meta>

export const Gray: Story = {
  args: { _type: 'ctaBlock', headline: 'Ready to get started?', subtext: 'Join 500+ businesses.', ctaLabel: 'Start free trial', background: 'gray' },
}
export const Dark: Story = {
  args: { _type: 'ctaBlock', headline: 'Take your business further', ctaLabel: 'Get started', background: 'dark' },
}
export const White: Story = {
  args: { _type: 'ctaBlock', headline: 'Transform your workflow', ctaLabel: 'Book a demo', background: 'white' },
}
