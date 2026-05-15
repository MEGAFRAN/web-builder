import type { Meta, StoryObj } from '@storybook/react'
import { PricingTable } from './PricingTable'

const meta = {
  title: 'Sections/PricingTable',
  component: PricingTable,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof PricingTable>

export default meta
type Story = StoryObj<typeof meta>

const tiers = [
  {
    name: 'Starter',
    price: '$29',
    period: '/mo',
    description: 'For small teams and solo creators.',
    features: ['5 projects', '10 GB storage', 'Email support'],
    ctaLabel: 'Get started',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$79',
    period: '/mo',
    description: 'Everything you need to grow.',
    features: ['Unlimited projects', '100 GB storage', 'Priority support', 'Analytics'],
    ctaLabel: 'Start Pro',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: '$199',
    period: '/mo',
    description: 'For large organizations.',
    features: ['Everything in Pro', 'SSO', 'Dedicated manager', 'SLA guarantee'],
    ctaLabel: 'Contact sales',
    highlighted: false,
  },
]

export const ThreeTiers: Story = {
  args: { title: 'Simple pricing', subtitle: 'No hidden fees. Cancel anytime.', tiers },
}
export const TwoTiers: Story = {
  args: { title: 'Choose a plan', tiers: tiers.slice(0, 2) },
}
export const NoHeader: Story = {
  args: { tiers },
}
