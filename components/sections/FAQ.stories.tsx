import type { Meta, StoryObj } from '@storybook/react'
import { FAQ } from './FAQ'
import { mockFaqItems } from '@/stories/mocks/cms-fixtures'

const meta = {
  title: 'Sections/FAQ',
  component: FAQ,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof FAQ>

export default meta
type Story = StoryObj<typeof meta>

export const WithTitle: Story = {
  args: { title: 'Frequently asked questions', items: mockFaqItems },
}
export const NoTitle: Story = {
  args: { items: mockFaqItems },
}
export const FewItems: Story = {
  args: { title: 'Common questions', items: mockFaqItems.slice(0, 2) },
}
