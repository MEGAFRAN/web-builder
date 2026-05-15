import type { Meta, StoryObj } from '@storybook/react'
import { FeatureGrid } from './FeatureGrid'

const meta = {
  title: 'Sections/FeatureGrid',
  component: FeatureGrid,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    cols: { control: 'select', options: ['2', '3'] },
  },
} satisfies Meta<typeof FeatureGrid>

export default meta
type Story = StoryObj<typeof meta>

const baseFeatures = [
  { title: 'Lightning Fast', description: 'Optimized for speed on all devices and network conditions.' },
  { title: 'Fully Customizable', description: 'Every element can be tailored to match your brand identity.' },
  { title: '24/7 Support', description: 'Our team is always available to help you succeed.' },
  { title: 'Secure by Default', description: 'Enterprise-grade security baked into every layer.' },
  { title: 'Analytics Ready', description: 'Built-in insights to help you make data-driven decisions.' },
  { title: 'Scalable Architecture', description: 'Grows with your business from launch to millions of users.' },
]

const featuresWithIcons = baseFeatures.map((f, i) => ({
  ...f,
  icon: ['⚡', '🎨', '🛡️', '📊', '🚀', '📈'][i],
}))

export const ThreeCols: Story = {
  args: { title: 'Why choose us', subtitle: 'Everything you need to succeed.', features: baseFeatures.slice(0, 3), cols: '3' },
}
export const SixFeatures: Story = {
  args: { title: 'Platform features', features: baseFeatures, cols: '3' },
}
export const TwoCols: Story = {
  args: { title: 'Key benefits', features: baseFeatures.slice(0, 4), cols: '2' },
}
export const WithIcons: Story = {
  args: { title: 'What you get', features: featuresWithIcons, cols: '3' },
}
