import type { Meta, StoryObj } from '@storybook/react'
import { Hero } from './Hero'

const meta = {
  title: 'Sections/Hero',
  component: Hero,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    align: { control: 'select', options: ['left', 'center'] },
  },
} satisfies Meta<typeof Hero>

export default meta
type Story = StoryObj<typeof meta>

export const Centered: Story = {
  args: { headline: 'Build something great', subtext: 'A modern platform for modern teams.', ctaLabel: 'Get started', align: 'center' },
}
export const LeftAligned: Story = {
  args: { headline: 'Your business, elevated', subtext: 'We help companies grow faster with better tools.', ctaLabel: 'Learn more', align: 'left' },
}
export const WithCta: Story = {
  args: { headline: 'Take the next step', ctaLabel: 'Start free trial', align: 'center' },
}
export const HeadlineOnly: Story = {
  args: { headline: 'Simple. Powerful. Fast.' },
}
export const WithBackgroundImage: Story = {
  args: {
    headline: 'Hair Salon',
    subtext: 'Personalized haircuts and color in a calm, welcoming studio.',
    ctaLabel: 'Book Now',
    ctaAction: '#book',
    backgroundImageUrl: 'https://picsum.photos/seed/hero-photo/1600/900',
    fullViewportHeightMobile: true,
  },
}
export const WithGradientFallback: Story = {
  args: {
    headline: 'Your business, elevated',
    subtext: 'Theme-driven gradient when no photo is configured.',
    ctaLabel: 'Get started',
    gradientFallback: true,
    fullViewportHeightMobile: true,
  },
}
