import type { Meta, StoryObj } from '@storybook/react'
import { LogoCloud } from './LogoCloud'
import { mockLogos } from '@/stories/mocks/cms-fixtures'

const meta = {
  title: 'Sections/LogoCloud',
  component: LogoCloud,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof LogoCloud>

export default meta
type Story = StoryObj<typeof meta>

export const TextLogos: Story = {
  args: { title: 'Trusted by leading companies', logos: mockLogos },
}
export const WithImages: Story = {
  args: {
    title: 'Our partners',
    logos: [
      { src: 'https://picsum.photos/seed/logo1/120/40', alt: 'Partner A' },
      { src: 'https://picsum.photos/seed/logo2/120/40', alt: 'Partner B' },
      { src: 'https://picsum.photos/seed/logo3/120/40', alt: 'Partner C' },
    ],
  },
}
export const NoTitle: Story = {
  args: { logos: mockLogos },
}
