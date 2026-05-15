import type { Meta, StoryObj } from '@storybook/react'
import PricingPageBlock from './PricingPageBlock'
import { mockPricingTiers, mockTestimonials, mockFaqItems } from '@/stories/mocks/cms-fixtures'

const meta = {
  title: 'Blocks/PricingPageBlock',
  component: PricingPageBlock,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof PricingPageBlock>

export default meta
type Story = StoryObj<typeof meta>

const testimonials = mockTestimonials.map((t) => ({
  name: t.name,
  company: t.company ?? null,
  role: t.role ?? null,
  quote: t.quote,
  avatarUrl: t.avatarUrl ?? null,
}))

export const Default: Story = {
  args: {
    _type: 'pricingPageBlock',
    tiers: mockPricingTiers,
    testimonials,
    faqItems: mockFaqItems,
  },
}
export const WithBanner: Story = {
  args: {
    _type: 'pricingPageBlock',
    tiers: mockPricingTiers,
    promotionBanner: {
      message: '50% off your first 3 months — limited time offer!',
      expiresAt: '2027-12-31T23:59:59Z',
    },
    testimonials,
    faqItems: mockFaqItems,
  },
}
