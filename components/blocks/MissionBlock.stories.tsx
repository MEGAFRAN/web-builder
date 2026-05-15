import type { Meta, StoryObj } from '@storybook/react'
import MissionBlock from './MissionBlock'

const meta = {
  title: 'Blocks/MissionBlock',
  component: MissionBlock,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof MissionBlock>

export default meta
type Story = StoryObj<typeof meta>

export const TextOnly: Story = {
  args: {
    _type: 'missionBlock',
    heading: 'Our mission',
    body: 'We believe that great design is a superpower. Our goal is to make beautiful, functional software accessible to every business — not just those with Silicon Valley budgets.',
  },
}
export const WithImage: Story = {
  args: {
    _type: 'missionBlock',
    heading: 'Built on trust',
    body: 'For over a decade, we have been building software that helps businesses serve their customers better. Our commitment to quality and transparency is at the core of everything we do.',
    imageUrl: 'https://picsum.photos/seed/mission/600/400',
    imageAlt: 'The team at work',
  },
}
