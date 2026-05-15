import type { Meta, StoryObj } from '@storybook/react'
import { CTA } from './CTA'

const meta = {
  title: 'Sections/CTA',
  component: CTA,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    background: { control: 'select', options: ['white', 'gray', 'dark'] },
  },
} satisfies Meta<typeof CTA>

export default meta
type Story = StoryObj<typeof meta>

export const Gray: Story = {
  args: { headline: 'Ready to get started?', subtext: 'Join 500+ businesses already using our platform.', ctaLabel: 'Start free trial', background: 'gray' },
}
export const White: Story = {
  args: { headline: 'Transform your workflow', ctaLabel: 'Book a demo', background: 'white' },
}
export const Dark: Story = {
  args: { headline: 'Take your business further', subtext: 'No credit card required.', ctaLabel: 'Get started', background: 'dark' },
}
