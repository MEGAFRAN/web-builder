import type { Meta, StoryObj } from '@storybook/react'
import ServicesPageBlock from './ServicesPageBlock'
import { mockFaqItems } from '@/stories/mocks/cms-fixtures'

const meta = {
  title: 'Blocks/ServicesPageBlock',
  component: ServicesPageBlock,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ServicesPageBlock>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    _type: 'servicesPageBlock',
    heroHeading: 'What we offer',
    heroText: 'End-to-end solutions tailored to your business.',
    featureCategories: [
      { title: 'Strategy', summary: 'From market research to go-to-market planning.', categoryBadge: 'Phase 1' },
      { title: 'Design', summary: 'Beautiful, functional interfaces your users will love.', categoryBadge: 'Phase 2' },
      { title: 'Development', summary: 'Clean, scalable code delivered on schedule.', categoryBadge: 'Phase 3' },
    ],
    serviceCards: [
      {
        title: 'Brand Identity',
        description: 'Logo, colors, typography, and usage guidelines.',
        deliverables: ['Logo suite', 'Brand guidelines', 'Color palette'],
        ctaLabel: 'Learn more',
      },
      {
        title: 'Web Design',
        description: 'Responsive, conversion-optimized website design.',
        deliverables: ['Wireframes', 'UI design', 'Prototype'],
        ctaLabel: 'Learn more',
      },
    ],
    faqItems: mockFaqItems,
  },
}
