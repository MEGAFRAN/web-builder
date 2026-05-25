import type { Meta, StoryObj } from '@storybook/react'
import HomepageHeroBlock from './HomepageHeroBlock'

const meta = {
  title: 'Blocks/HomepageHeroBlock',
  component: HomepageHeroBlock,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof HomepageHeroBlock>

export default meta
type Story = StoryObj<typeof meta>

export const WithPrimaryButton: Story = {
  args: {
    _type: 'heroBlock',
    heading: 'The platform your team deserves',
    subtext: 'Build, ship, and scale with confidence.',
    primaryButtonLabel: 'Start free trial',
  },
}
export const WithBackgroundImage: Story = {
  args: {
    _type: 'heroBlock',
    heading: 'Hair Salon',
    subtext: 'Personalized haircuts and color in a calm, welcoming studio.',
    primaryButtonLabel: 'Book Now',
    primaryButtonHref: '#book',
    backgroundImageUrl: 'https://picsum.photos/seed/hair-salon-hero/1600/900',
  },
}
export const PrimaryOnly: Story = {
  args: {
    _type: 'heroBlock',
    heading: 'Your business, elevated',
    subtext: 'We help companies grow faster.',
    primaryButtonLabel: 'Get started',
  },
}
export const HeadlineOnly: Story = {
  args: { _type: 'heroBlock', heading: 'Something worth building.' },
}
