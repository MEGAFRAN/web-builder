import type { Meta, StoryObj } from '@storybook/react'
import { StatsBar } from './StatsBar'
import { mockStats } from '@/stories/mocks/cms-fixtures'

const meta = {
  title: 'Sections/StatsBar',
  component: StatsBar,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    background: { control: 'select', options: ['white', 'gray', 'dark'] },
  },
} satisfies Meta<typeof StatsBar>

export default meta
type Story = StoryObj<typeof meta>

export const White: Story = { args: { stats: mockStats, background: 'white' } }
export const Gray: Story = { args: { stats: mockStats, background: 'gray' } }
export const Dark: Story = { args: { stats: mockStats, background: 'dark' } }
export const TwoStats: Story = { args: { stats: mockStats.slice(0, 2), background: 'gray' } }
