import type { Meta, StoryObj } from '@storybook/react'
import FaqBlock from './FaqBlock'
import { mockFaqItems } from '@/stories/mocks/cms-fixtures'

const meta = {
  title: 'Blocks/FaqBlock',
  component: FaqBlock,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof FaqBlock>

export default meta
type Story = StoryObj<typeof meta>

export const WithTitle: Story = {
  args: { _type: 'faqBlock', title: 'Frequently asked questions', items: mockFaqItems },
}
export const NoTitle: Story = {
  args: { _type: 'faqBlock', items: mockFaqItems },
}
